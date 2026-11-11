import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as api from '../data/api';
import UploadScreen from './UploadScreen';
import messages from './messages';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  createJob: jest.fn(),
  uploadFile: jest.fn(),
  startJob: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const COURSE_ID = 'course-v1:Sherab+tspc12+2026';
const UPLOAD = { method: 'PUT', url: 'https://s3.example/signed', headers: { 'Content-Type': 'audio/mpeg' } };

const recording = (name = 'Day 1 - Morning.mp3', type = 'audio/mpeg') => new File(['audio'], name, { type });

const renderScreen = () => {
  const onStarted = jest.fn();
  render(
    <IntlProvider locale="en">
      <UploadScreen courseId={COURSE_ID} maxUploadMb={1024} onStarted={onStarted} />
    </IntlProvider>,
  );
  return onStarted;
};

const text = (message: { defaultMessage?: string }) => message.defaultMessage as string;

const fillIn = async (user: ReturnType<typeof userEvent.setup>, { speakers = 'one', language = 'bo' } = {}) => {
  await user.upload(screen.getByTestId('recording-file-input'), recording());
  await user.type(screen.getByLabelText(text(messages.teacherLabel)), 'Geshe Tenzin');
  await user.click(screen.getByLabelText(text(speakers === 'one' ? messages.oneSpeaker : messages.multipleSpeakers)));
  await user.selectOptions(screen.getByLabelText(text(messages.teacherLanguageLabel)), language);
  await user.click(screen.getByLabelText(text(messages.consentLabel)));
};

beforeEach(() => {
  jest.resetAllMocks();
  mockedApi.createJob.mockResolvedValue({ job: { id: 'job-1' } as api.Job, upload: UPLOAD });
  mockedApi.uploadFile.mockImplementation(async (_target, _file, onProgress) => { onProgress(100); });
  mockedApi.startJob.mockResolvedValue({ id: 'job-1', status: 'queued' } as api.Job);
});

it('says what is missing and uploads nothing', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(screen.getByRole('button', { name: text(messages.submit) }));

  [messages.errorFileMissing, messages.errorTeacher, messages.errorSpeakers, messages.errorLanguage,
    messages.errorConsent].forEach((message) => expect(screen.getByText(text(message))).not.toBeNull());
  expect(mockedApi.createJob).not.toHaveBeenCalled();
});

it('refuses files that are not audio', async () => {
  const user = userEvent.setup({ applyAccept: false });
  renderScreen();

  await user.upload(screen.getByTestId('recording-file-input'), recording('slides.pdf', 'application/pdf'));

  expect(screen.getByText(text(messages.errorFileType))).not.toBeNull();
  expect(screen.queryByText('slides.pdf')).toBeNull();
});

it('says straight away that other languages are not supported, and blocks the upload', async () => {
  const user = userEvent.setup();
  renderScreen();

  await fillIn(user, { language: 'other' });
  expect(screen.getByText(text(messages.errorLanguageUnsupported))).not.toBeNull();

  await user.click(screen.getByRole('button', { name: text(messages.submit) }));
  expect(mockedApi.createJob).not.toHaveBeenCalled();
});

it('asks for the translation language only when more than one person speaks', async () => {
  const user = userEvent.setup();
  renderScreen();
  const translatorField = () => screen.queryByLabelText(text(messages.translatorLanguageLabel), { exact: false });

  expect(translatorField()).toBeNull();
  await user.click(screen.getByLabelText(text(messages.multipleSpeakers)));
  expect(translatorField()).not.toBeNull();
  expect(screen.getByText(text(messages.multipleSpeakersHelp))).not.toBeNull();
});

it('creates the job, uploads the file to the signed link, then starts processing', async () => {
  const user = userEvent.setup();
  const onStarted = renderScreen();

  await fillIn(user, { speakers: 'many' });
  await user.type(screen.getByLabelText(text(messages.translatorLanguageLabel), { exact: false }), 'Ladakhi');
  await user.type(screen.getByLabelText(text(messages.yearLabel), { exact: false }), '2026');
  await user.click(screen.getByRole('button', { name: text(messages.submit) }));

  await waitFor(() => expect(onStarted).toHaveBeenCalledWith({ id: 'job-1', status: 'queued' }));
  expect(mockedApi.createJob).toHaveBeenCalledWith({
    courseId: COURSE_ID,
    file: expect.any(File),
    contentType: 'audio/mpeg',
    details: {
      teacher: 'Geshe Tenzin',
      multipleSpeakers: true,
      teacherLanguage: 'bo',
      translatorLanguage: 'Ladakhi',
      text: undefined,
      place: undefined,
      year: 2026,
    },
  });
  expect(mockedApi.uploadFile).toHaveBeenCalledWith(UPLOAD, expect.any(File), expect.any(Function));
  expect(mockedApi.startJob).toHaveBeenCalledWith('job-1');
});

it('shows Studio’s reason when it refuses the job', async () => {
  const user = userEvent.setup();
  mockedApi.createJob.mockRejectedValue({ response: { data: { size: ['The file is larger than 2048 MB.'] } } });
  const onStarted = renderScreen();

  await fillIn(user);
  await user.click(screen.getByRole('button', { name: text(messages.submit) }));

  expect(await screen.findByText('The file is larger than 2048 MB.')).not.toBeNull();
  expect(mockedApi.uploadFile).not.toHaveBeenCalled();
  expect(onStarted).not.toHaveBeenCalled();
});

it('lets the author try again when the upload stops', async () => {
  const user = userEvent.setup();
  mockedApi.uploadFile.mockRejectedValue(new Error('Upload failed'));
  renderScreen();

  await fillIn(user);
  await user.click(screen.getByRole('button', { name: text(messages.submit) }));

  expect(await screen.findByText(text(messages.errorUpload))).not.toBeNull();
  expect(mockedApi.startJob).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: text(messages.submit) })).not.toBeNull();
});

it('uses Studio\'s upload limit', async () => {
  const user = userEvent.setup();
  renderScreen();
  expect(screen.getByText(/up to 1 GB/)).not.toBeNull();

  const large = recording();
  Object.defineProperty(large, 'size', { value: 1025 * 1024 * 1024 });
  await user.upload(screen.getByTestId('recording-file-input'), large);
  expect(screen.getByText('The file is larger than 1 GB.')).not.toBeNull();
});

it('when starting fails after the upload, trying again only starts it', async () => {
  const user = userEvent.setup();
  const onStarted = renderScreen();
  mockedApi.startJob
    .mockRejectedValueOnce({ response: { data: { error: 'The recording could not be queued.' } } })
    .mockResolvedValueOnce({ id: 'job-1', status: 'queued' } as api.Job);
  await fillIn(user);

  await user.click(screen.getByRole('button', { name: text(messages.submit) }));
  expect(await screen.findByText(text(messages.uploadedNotStarted))).not.toBeNull();
  expect(screen.getByLabelText(text(messages.teacherLabel))).toHaveProperty('disabled', true);

  await user.click(screen.getByRole('button', { name: text(messages.submitUploaded) }));

  await waitFor(() => expect(onStarted).toHaveBeenCalled());
  expect(mockedApi.createJob).toHaveBeenCalledTimes(1);
  expect(mockedApi.uploadFile).toHaveBeenCalledTimes(1);
  expect(mockedApi.startJob).toHaveBeenNthCalledWith(2, 'job-1');
});
