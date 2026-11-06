import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen } from '@testing-library/react';

import type { Job } from '../data/api';
import ProgressScreen from './ProgressScreen';
import messages from './messages';

const job = (changes: Partial<Job>, multipleSpeakers = false, teacherLanguage: 'bo' | 'en' = 'bo'): Job => ({
  id: 'job-1',
  status: 'queued',
  progress: 0,
  speakerLabels: {},
  details: { teacher: 'Geshe Tenzin', multipleSpeakers, teacherLanguage },
  ...changes,
} as Job);

const renderScreen = (value: Job) => render(
  <IntlProvider locale="en">
    <ProgressScreen job={value} />
  </IntlProvider>,
);

const stageState = (message: { defaultMessage?: string }) => (
  screen.getByText(message.defaultMessage as string).closest('li')?.className
);

it('says a queued recording is waiting for its turn, without a progress bar', () => {
  renderScreen(job({ status: 'queued' }));

  expect(screen.getByRole('heading', { name: messages.queuedTitle.defaultMessage })).not.toBeNull();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(stageState(messages.stageLearnNoise)).toContain('--pending');
});

it('shows the step being worked on, how far it is, and which of its parts are done', () => {
  renderScreen(job({ status: 'finding_speakers', progress: 50 }, true));

  expect(screen.getByRole('heading', { name: messages.findSpeakersTitle.defaultMessage })).not.toBeNull();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
  expect(screen.getByText('50%')).not.toBeNull();
  expect(stageState(messages.stageListenVoices)).toContain('--done');
  expect(stageState(messages.stageGroupVoices)).toContain('--current');
  expect(stageState(messages.stageVoiceSamples)).toContain('--pending');
});

it('lists the parts of transcription that apply to the recording', () => {
  renderScreen(job({ status: 'transcribing', progress: 10 }, true, 'bo'));
  expect(screen.getByText(messages.stageTeacherParts.defaultMessage as string)).not.toBeNull();
  expect(screen.getByText(messages.stageSpelling.defaultMessage as string)).not.toBeNull();
});

it('has no teacher parts or Tibetan spelling check for one English speaker', () => {
  renderScreen(job({ status: 'transcribing', progress: 10 }, false, 'en'));
  expect(screen.queryByText(messages.stageTeacherParts.defaultMessage as string)).toBeNull();
  expect(screen.queryByText(messages.stageSpelling.defaultMessage as string)).toBeNull();
});

it('shows movement, not 0%, until the first progress arrives', () => {
  renderScreen(job({ status: 'cleaning', progress: 0 }));

  expect(screen.getByText(messages.starting.defaultMessage as string)).not.toBeNull();
  expect(screen.queryByText('0%')).toBeNull();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBeNull();
});

it('names the recording and its length', () => {
  renderScreen(job({
    status: 'cleaning', progress: 10, originalFilename: 'Day 1.mp3', durationSeconds: 3600,
  }));
  expect(screen.getByText('Day 1.mp3 · 60 min')).not.toBeNull();
});

it('starts a run by getting the recording ready, as the first tenth of the step', () => {
  const { rerender } = renderScreen(job({ status: 'cleaning', progress: 5 }));
  expect(stageState(messages.stagePrepare)).toContain('--current');
  expect(stageState(messages.stageLearnNoise)).toContain('--pending');

  rerender(
    <IntlProvider locale="en">
      <ProgressScreen job={job({ status: 'cleaning', progress: 12 })} />
    </IntlProvider>,
  );
  expect(stageState(messages.stagePrepare)).toContain('--done');
  expect(stageState(messages.stageLearnNoise)).toContain('--current');
});
