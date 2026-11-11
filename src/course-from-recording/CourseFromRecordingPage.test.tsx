import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as api from './data/api';
import CourseFromRecordingPage from './CourseFromRecordingPage';
import failedMessages from './failed/messages';
import messages from './messages';
import progressMessages from './progress/messages';
import readyMessages from './course-ready/messages';
import shapeMessages from './shape-course/messages';
import startOverMessages from './start-over/messages';
import tagMessages from './tag-voices/messages';
import transcriptMessages from './transcript/messages';
import uploadMessages from './upload/messages';

jest.mock('./data/api', () => ({
  ...jest.requireActual('./data/api'),
  getLatestJob: jest.fn(),
  retryJob: jest.fn(),
  startOver: jest.fn(),
  reuseRecording: jest.fn(),
  saveCourseDraft: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const text = (message: { defaultMessage?: string }) => message.defaultMessage as string;

const COURSE_ID = 'course-v1:Sherab+tspc12+2026';

const renderAt = (path: string) => render(
  <IntlProvider locale="en">
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/course-from-recording/:courseId" element={<CourseFromRecordingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </IntlProvider>,
);

// Studio's answer: the latest job, and its upload limit.
const latest = (job: api.Job | null) => ({ job, maxUploadMb: 2048 });

beforeEach(() => jest.resetAllMocks());

it('opens the upload screen for a course with no recording yet', async () => {
  mockedApi.getLatestJob.mockResolvedValue(latest(null));

  renderAt(`/course-from-recording/${COURSE_ID}`);

  expect(screen.getByRole('heading', { name: messages.title.defaultMessage })).not.toBeNull();
  expect(screen.getByText(`Course: ${COURSE_ID}`)).not.toBeNull();
  expect(await screen.findByRole('button', { name: uploadMessages.submit.defaultMessage })).not.toBeNull();
  expect(mockedApi.getLatestJob).toHaveBeenCalledWith(COURSE_ID);
});

const runningJob = (changes: Partial<api.Job> = {}) => ({
  id: 'job-1',
  status: 'transcribing',
  statusLabel: 'Transcribing',
  progress: 40,
  error: '',
  speakerLabels: {},
  originalFilename: 'Day 1.mp3',
  created: '2026-11-03T08:00:00Z',
  details: { teacher: 'Geshe Tenzin', multipleSpeakers: false, teacherLanguage: 'bo' },
  ...changes,
} as api.Job);

it('shows the progress of a recording being processed', async () => {
  mockedApi.getLatestJob.mockResolvedValue(latest(runningJob()));

  renderAt(`/course-from-recording/${COURSE_ID}`);

  expect(await screen.findByRole('heading', { name: progressMessages.transcribeTitle.defaultMessage })).not.toBeNull();
  expect(screen.getByText('40%')).not.toBeNull();
  expect(document.querySelector('[aria-current="step"]')?.textContent).toContain(messages.stepTranscribe.defaultMessage);
  expect(screen.queryByRole('button', { name: uploadMessages.submit.defaultMessage })).toBeNull();
});

describe('checking for progress', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('asks Studio again every few seconds while the service is working', async () => {
    mockedApi.getLatestJob
      .mockResolvedValueOnce(latest(runningJob({ progress: 40 })))
      .mockResolvedValueOnce(latest(runningJob({ progress: 70 })));
    renderAt(`/course-from-recording/${COURSE_ID}`);
    expect(await screen.findByText('40%')).not.toBeNull();

    await act(async () => { jest.advanceTimersByTime(5000); });

    expect(await screen.findByText('70%')).not.toBeNull();
  });

  it('stops asking while it waits for the author', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({
      status: 'needs_speaker_labels',
      statusLabel: 'Waiting for you to tag the voices',
      speakerGroups: [{ group: '1', minutes: 90, samples: ['https://s3.example/1-a.mp3'] }],
      details: { teacher: 'T', multipleSpeakers: true, teacherLanguage: 'bo' },
    })));
    renderAt(`/course-from-recording/${COURSE_ID}`);
    expect(await screen.findByRole('heading', { name: tagMessages.title.defaultMessage })).not.toBeNull();

    await act(async () => { jest.advanceTimersByTime(30000); });

    expect(mockedApi.getLatestJob).toHaveBeenCalledTimes(1);
  });
});

it('shows a finished transcript', async () => {
  mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({ status: 'transcript_ready', statusLabel: 'Transcript ready' })));

  renderAt(`/course-from-recording/${COURSE_ID}`);

  expect(await screen.findByRole('heading', { name: text(transcriptMessages.title) })).not.toBeNull();
});

it('shows Studio’s reason when the tool cannot open', async () => {
  mockedApi.getLatestJob.mockRejectedValue({ response: { data: { error: 'The recording tool is not set up on this server.' } } });

  renderAt(`/course-from-recording/${COURSE_ID}`);

  expect(await screen.findByText('The recording tool is not set up on this server.')).not.toBeNull();
});

describe('a failed recording', () => {
  const failed = runningJob({ status: 'failed', statusLabel: 'Failed', error: 'Monlam timed out' });

  it('says what went wrong', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(failed));

    renderAt(`/course-from-recording/${COURSE_ID}`);

    expect(await screen.findByText('What went wrong: Monlam timed out')).not.toBeNull();
    expect(screen.getByText('Recording: Day 1.mp3')).not.toBeNull();
  });

  it('can be tried again', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(failed));
    mockedApi.retryJob.mockResolvedValue({ ...failed, status: 'queued', progress: 0 });
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await user.click(await screen.findByRole('button', { name: failedMessages.retry.defaultMessage }));

    expect(mockedApi.retryJob).toHaveBeenCalledWith('job-1');
    expect(await screen.findByRole('heading', { name: progressMessages.queuedTitle.defaultMessage })).not.toBeNull();
  });

  it('can be replaced by another recording, once the author confirms', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(failed));
    mockedApi.startOver.mockResolvedValue({ ...failed, status: 'cancelled', recordingKept: false });
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await user.click(await screen.findByRole('button', { name: failedMessages.uploadAnother.defaultMessage }));
    // The confirmation opens with "a different recording" chosen.
    expect((screen.getByLabelText(text(startOverMessages.differentRecording)) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole('button', { name: text(startOverMessages.confirm) }));

    expect(mockedApi.startOver).toHaveBeenCalledWith('job-1', false);
    expect(await screen.findByRole('button', { name: uploadMessages.submit.defaultMessage })).not.toBeNull();
    expect(mockedApi.retryJob).not.toHaveBeenCalled();
  });
});

it('the step bar follows the answer to how many people speak', async () => {
  const user = userEvent.setup();
  mockedApi.getLatestJob.mockResolvedValue(latest(null));
  renderAt(`/course-from-recording/${COURSE_ID}`);
  const stepNames = () => [...document.querySelectorAll('.recording-steps__name')].map((name) => name.textContent);

  expect(await screen.findByRole('button', { name: uploadMessages.submit.defaultMessage })).not.toBeNull();
  expect(stepNames()).not.toContain(messages.stepFindSpeakers.defaultMessage);

  await user.click(screen.getByLabelText(uploadMessages.multipleSpeakers.defaultMessage as string));
  expect(stepNames()).toContain(messages.stepFindSpeakers.defaultMessage);
});

describe('starting over', () => {
  const transcribed = runningJob({
    status: 'transcript_ready',
    statusLabel: 'Transcript ready',
    transcribedMinutes: 41.6,
    downloads: { clean: 'https://s3.example/clean.flac', transcript: 'https://s3.example/transcript.txt' },
    details: {
      teacher: 'Geshe Tenzin', multipleSpeakers: false, teacherLanguage: 'bo', text: 'Bodhicaryavatara', year: 2024,
    },
    fileSize: 52428800,
  });

  const openConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('button', { name: text(startOverMessages.startOver) }));
    return screen.getByRole('region', { name: text(startOverMessages.title) });
  };

  it('is offered on every step after the upload, but not on the upload itself', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob()));
    renderAt(`/course-from-recording/${COURSE_ID}`);
    expect(await screen.findByRole('button', { name: text(startOverMessages.startOver) })).not.toBeNull();
  });

  it('is not offered before there is a recording', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(null));
    renderAt(`/course-from-recording/${COURSE_ID}`);
    expect(await screen.findByRole('button', { name: uploadMessages.submit.defaultMessage })).not.toBeNull();
    expect(screen.queryByRole('button', { name: text(startOverMessages.startOver) })).toBeNull();
  });

  it('says what is deleted, and that transcribing again is paid for again', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(transcribed));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    const confirmation = await openConfirmation(user);

    const deleted = () => [...confirmation.querySelectorAll('li')].map((item) => item.textContent);
    expect(deleted()).toEqual([text(startOverMessages.cleanAudio), text(startOverMessages.transcript)]);
    expect(confirmation.textContent).toContain('42 minutes of this recording were already transcribed.');
    expect((screen.getByLabelText(text(startOverMessages.keepRecording)) as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByLabelText(text(startOverMessages.differentRecording)));
    expect(deleted()).toContain(text(startOverMessages.recording));
  });

  it('changes nothing when cancelled', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(transcribed));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await openConfirmation(user);
    await user.click(screen.getByRole('button', { name: text(startOverMessages.cancel) }));

    expect(screen.getByRole('heading', { name: text(transcriptMessages.title) })).not.toBeNull();
    expect(mockedApi.startOver).not.toHaveBeenCalled();
  });

  it('keeps the recording, fills in the details again, and starts without uploading', async () => {
    const user = userEvent.setup();
    const cancelled = { ...transcribed, status: 'cancelled', recordingKept: true } as api.Job;
    mockedApi.getLatestJob.mockResolvedValue(latest(transcribed));
    mockedApi.startOver.mockResolvedValue(cancelled);
    mockedApi.reuseRecording.mockResolvedValue(runningJob({ id: 'job-2', status: 'queued', progress: 0 }));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await openConfirmation(user);
    await user.click(screen.getByRole('button', { name: text(startOverMessages.confirm) }));

    expect(mockedApi.startOver).toHaveBeenCalledWith('job-1', true);
    expect(await screen.findByText(text(uploadMessages.startedOverKept))).not.toBeNull();
    expect(screen.getByText('Day 1.mp3')).not.toBeNull();
    expect((screen.getByLabelText(text(uploadMessages.teacherLabel)) as HTMLInputElement).value).toBe('Geshe Tenzin');
    expect((screen.getByLabelText(/^Year/) as HTMLInputElement).value).toBe('2024');
    expect((screen.getByLabelText(text(uploadMessages.teacherLanguageLabel)) as HTMLSelectElement).value).toBe('bo');
    expect((screen.getByLabelText(text(uploadMessages.oneSpeaker)) as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByRole('button', { name: text(uploadMessages.submitKept) }));

    expect(mockedApi.reuseRecording).toHaveBeenCalledWith('job-1', expect.objectContaining({
      teacher: 'Geshe Tenzin', multipleSpeakers: false, teacherLanguage: 'bo', year: 2024,
    }));
    expect(await screen.findByRole('heading', { name: progressMessages.queuedTitle.defaultMessage })).not.toBeNull();
  });

  it('can still switch to a different recording after keeping it', async () => {
    const user = userEvent.setup();
    const kept = { ...transcribed, status: 'cancelled', recordingKept: true } as api.Job;
    mockedApi.getLatestJob.mockResolvedValue(latest(kept));
    mockedApi.startOver.mockResolvedValue({ ...kept, recordingKept: false });
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await user.click(await screen.findByRole('button', { name: text(uploadMessages.useDifferentRecording) }));

    expect(mockedApi.startOver).toHaveBeenCalledWith('job-1', false);
    expect(await screen.findByText(text(uploadMessages.startedOver))).not.toBeNull();
    expect(screen.getByTestId('recording-file-input')).not.toBeNull();
    expect(screen.queryByText('Day 1.mp3')).toBeNull();
    // The details are still filled in.
    expect((screen.getByLabelText(text(uploadMessages.teacherLabel)) as HTMLInputElement).value).toBe('Geshe Tenzin');
  });

  it('shows Studio’s reason when it does not work', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(transcribed));
    mockedApi.startOver.mockRejectedValue({ response: { data: { error: 'The files could not all be deleted.' } } });
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await openConfirmation(user);
    await user.click(screen.getByRole('button', { name: text(startOverMessages.confirm) }));

    expect(await screen.findByText('The files could not all be deleted.')).not.toBeNull();
  });
});

describe('the course', () => {
  const courseDraft = {
    version: 1,
    courseTitle: 'སྤྱོད་འཇུག',
    sections: [{
      id: 's1',
      title: 'ལེའུ་དང་པོ།',
      lessons: [{
        id: 's1-l1',
        title: 'སྐྱབས་འགྲོ།',
        include: true,
        firstLine: 0,
        lastLine: 3,
        start: 0,
        end: 600,
        minutes: 10,
        summary: '',
        keyPoints: [],
        mcq: [],
        reflection: [],
      }],
    }],
  };

  it('opens the suggested course for the author to shape', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({ status: 'course_draft_ready', courseDraft })));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    expect(await screen.findByRole('heading', { name: text(shapeMessages.title) })).not.toBeNull();
    expect(screen.getByDisplayValue('སྐྱབས་འགྲོ།')).not.toBeNull();
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain(text(messages.stepShape));
  });

  it('keeps the author’s changes when they look at Start over and come back', async () => {
    const user = userEvent.setup();
    mockedApi.saveCourseDraft.mockImplementation(async (_id, saved) => saved);
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({ status: 'course_draft_ready', courseDraft })));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    await user.type(await screen.findByDisplayValue('སྐྱབས་འགྲོ།'), 'ཆེན་པོ།');
    await user.click(screen.getByRole('button', { name: text(startOverMessages.startOver) }));
    await user.click(screen.getByRole('button', { name: text(startOverMessages.cancel) }));

    expect(screen.getByDisplayValue('སྐྱབས་འགྲོ།ཆེན་པོ།')).not.toBeNull();
    // The change was sent as the screen closed.
    expect(mockedApi.saveCourseDraft.mock.calls[0][1].sections[0].lessons[0].title).toBe('སྐྱབས་འགྲོ།ཆེན་པོ།');
  });

  it('shows the finished draft course, and starting over leaves it in the outline', async () => {
    const user = userEvent.setup();
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({
      status: 'course_ready', courseDraft, courseApproved: true, courseSections: ['block-v1:s1'],
    })));
    renderAt(`/course-from-recording/${COURSE_ID}`);

    expect(await screen.findByRole('heading', { name: text(readyMessages.title) })).not.toBeNull();
    await user.click(screen.getByRole('button', { name: text(startOverMessages.startOver) }));
    expect(screen.getByText(text(startOverMessages.courseStays))).not.toBeNull();
  });

  it('keeps checking while the course is suggested or built', async () => {
    mockedApi.getLatestJob.mockResolvedValue(latest(runningJob({ status: 'suggesting', progress: 30 })));
    renderAt(`/course-from-recording/${COURSE_ID}`);
    expect(await screen.findByRole('heading', { name: text(progressMessages.suggestTitle) })).not.toBeNull();
  });
});
