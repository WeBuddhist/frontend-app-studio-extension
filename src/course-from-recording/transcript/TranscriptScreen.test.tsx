import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as api from '../data/api';
import TranscriptScreen from './TranscriptScreen';
import messages from './messages';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  saveTranscriptEdit: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const TRANSCRIPT_URL = 'https://s3.example/3-transcript/transcript.json';
const CLEAN_URL = 'https://s3.example/2-clean/clean.flac';

const LINES = [
  {
    start: 0, end: 26, speaker: 'no speech', text: null, warnings: [],
  },
  {
    start: 26, end: 31.5, speaker: 'teacher', text: 'ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།', warnings: [],
  },
  {
    start: 31.5, end: 40, speaker: 'teacher', text: 'དཀོན་མཆོག་གསུམ།', warnings: ['too little text (0.4 syllables/s) - words may be missing'],
  },
  {
    start: 40, end: 112, speaker: 'translator', text: null, warnings: [],
  },
  {
    start: 3725, end: 3730, speaker: 'teacher', text: 'བཀྲ་ཤིས།', warnings: [],
  },
];

const job = {
  id: 'job-1',
  status: 'transcript_ready',
  originalFilename: 'Day 1 teachings.mp3',
  downloads: { transcriptJson: TRANSCRIPT_URL, clean: CLEAN_URL },
  transcriptEdits: {},
} as unknown as api.Job;

const text = (message: { defaultMessage?: string }) => message.defaultMessage as string;

const renderScreen = (value: api.Job = job) => {
  const onLinksExpired = jest.fn();
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={new QueryClient()}>
        <TranscriptScreen job={value} onLinksExpired={onLinksExpired} />
      </QueryClientProvider>
    </IntlProvider>,
  );
  return { onLinksExpired };
};

const lineAt = async (time: string) => (
  (await screen.findByRole('button', { name: `Play from ${time}` })).closest('li') as HTMLElement
);

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => LINES }) as jest.Mock;
});

it('shows every line with its time, and the parts not written down', async () => {
  renderScreen();

  expect(await screen.findByText('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།')).not.toBeNull();
  expect(global.fetch).toHaveBeenCalledWith(TRANSCRIPT_URL);
  expect(screen.getByText('3 lines · 1 to check')).not.toBeNull();
  expect(screen.getByText('Silence · 26 s · not written down')).not.toBeNull();
  expect(screen.getByText('Translator · 1:12 · not written down')).not.toBeNull();
  // Past the first hour the time shows the hours.
  expect(screen.getByRole('button', { name: 'Play from 1:02:05' })).not.toBeNull();
});

it('says in plain words why a line should be checked', async () => {
  renderScreen();
  const line = await lineAt('0:32');

  expect(line.className).toContain('--check');
  expect(line.textContent).toContain('Listen and check: some words may be missing.');
});

it('shows only the lines to check on request', async () => {
  const user = userEvent.setup();
  renderScreen();
  await screen.findByText('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།');

  await user.click(screen.getByLabelText(text(messages.onlyToCheck)));

  expect(screen.queryByText('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།')).toBeNull();
  expect(screen.getByText('དཀོན་མཆོག་གསུམ།')).not.toBeNull();
});

it('plays the cleaned recording from a line', async () => {
  const user = userEvent.setup();
  renderScreen();
  const audio = document.querySelector('audio') as HTMLAudioElement;
  expect(audio.getAttribute('src')).toBe(CLEAN_URL);

  await user.click(await screen.findByRole('button', { name: 'Play from 0:32' }));

  expect(audio.currentTime).toBe(31.5);
  expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
});

it('shows which line is being heard, and pauses from its button', async () => {
  const user = userEvent.setup();
  const pause = jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  renderScreen();
  const line = await lineAt('0:32');
  const audio = document.querySelector('audio') as HTMLAudioElement;

  audio.currentTime = 33;
  act(() => {
    audio.dispatchEvent(new Event('play'));
    audio.dispatchEvent(new Event('timeupdate'));
  });

  expect(line.className).toContain('--playing');
  const button = within(line).getByRole('button', { name: 'Pause at 0:32' });
  expect(button.getAttribute('aria-pressed')).toBe('true');
  await user.click(button);
  expect(pause).toHaveBeenCalled();
});

it('shows the line that started last when two lines overlap', async () => {
  // The teacher's line runs on into the translator's turn, as in real transcripts.
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        start: 20.68, end: 38.25, speaker: 'teacher', text: 'དེ་ལ།', warnings: [],
      },
      {
        start: 35.25, end: 50.25, speaker: 'translator', text: null, warnings: [],
      },
    ],
  }) as jest.Mock;
  const user = userEvent.setup();
  renderScreen();
  const audio = document.querySelector('audio') as HTMLAudioElement;

  await user.click(await screen.findByRole('button', { name: 'Play from 0:35' }));
  act(() => {
    audio.dispatchEvent(new Event('play'));
    audio.dispatchEvent(new Event('timeupdate'));
  });

  expect(audio.currentTime).toBe(35.25);
  expect(screen.getByRole('button', { name: 'Pause at 0:35' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Play from 0:21' })).not.toBeNull();
});

it('saves a corrected line, and can undo it', async () => {
  const user = userEvent.setup();
  mockedApi.saveTranscriptEdit
    .mockResolvedValueOnce({ 2: 'དཀོན་མཆོག་གསུམ་ལ་སྐྱབས་སུ་མཆི།' })
    .mockResolvedValueOnce({});
  renderScreen();
  const line = await lineAt('0:32');

  await user.click(within(line).getByRole('button', { name: 'Edit the line at 0:32' }));
  const box = within(line).getByLabelText('Text at 0:32');
  await user.clear(box);
  await user.type(box, 'དཀོན་མཆོག་གསུམ་ལ་སྐྱབས་སུ་མཆི།');
  await user.click(within(line).getByRole('button', { name: text(messages.save) }));

  expect(mockedApi.saveTranscriptEdit).toHaveBeenCalledWith('job-1', 2, 'དཀོན་མཆོག་གསུམ་ལ་སྐྱབས་སུ་མཆི།');
  expect(await within(line).findByText('དཀོན་མཆོག་གསུམ་ལ་སྐྱབས་སུ་མཆི།')).not.toBeNull();
  expect(line.textContent).toContain(text(messages.corrected));
  expect(line.className).not.toContain('--check'); // checked by the author

  await user.click(within(line).getByRole('button', { name: text(messages.undo) }));

  expect(mockedApi.saveTranscriptEdit).toHaveBeenLastCalledWith('job-1', 2, null);
  expect(await within(line).findByText('དཀོན་མཆོག་གསུམ།')).not.toBeNull();
});

it('starts with the corrections already saved', async () => {
  renderScreen({ ...job, transcriptEdits: { 1: 'ཕྱག་འཚལ་ལོ།' } } as api.Job);
  expect(await screen.findByText('ཕྱག་འཚལ་ལོ།')).not.toBeNull();
  expect(screen.queryByText('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།')).toBeNull();
});

it('does not save an empty line', async () => {
  const user = userEvent.setup();
  renderScreen();
  const line = await lineAt('0:26');

  await user.click(within(line).getByRole('button', { name: 'Edit the line at 0:26' }));
  await user.clear(within(line).getByLabelText('Text at 0:26'));
  await user.click(within(line).getByRole('button', { name: text(messages.save) }));

  expect(within(line).getByRole('alert').textContent).toBe(text(messages.emptyError));
  expect(mockedApi.saveTranscriptEdit).not.toHaveBeenCalled();
});

it('shows Studio’s reason when a correction is not saved, and keeps the text', async () => {
  const user = userEvent.setup();
  mockedApi.saveTranscriptEdit.mockRejectedValue({ response: { data: { error: 'The transcript is not ready yet.' } } });
  renderScreen();
  const line = await lineAt('0:26');

  await user.click(within(line).getByRole('button', { name: 'Edit the line at 0:26' }));
  await user.type(within(line).getByLabelText('Text at 0:26'), '།');
  await user.click(within(line).getByRole('button', { name: text(messages.save) }));

  expect(await within(line).findByText('The transcript is not ready yet.')).not.toBeNull();
  expect((within(line).getByLabelText('Text at 0:26') as HTMLTextAreaElement).value).toBe('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།།');
});

it('downloads the transcript with the corrections', async () => {
  const user = userEvent.setup();
  let saved: Blob | undefined;
  URL.createObjectURL = jest.fn((blob: Blob) => { saved = blob; return 'blob:transcript'; });
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function inPage(this: HTMLElement) {
    expect(document.body.contains(this)).toBe(true); // Safari and Firefox need the link in the page
  });
  renderScreen({ ...job, transcriptEdits: { 1: 'ཕྱག་འཚལ་ལོ།' } } as api.Job);
  await screen.findByText('ཕྱག་འཚལ་ལོ།');

  await user.click(screen.getByRole('button', { name: text(messages.download) }));

  expect(click).toHaveBeenCalled();
  const content = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(saved as Blob);
  });
  expect(content).toContain('[0:26] ཕྱག་འཚལ་ལོ།');
  expect(content).toContain('[0:40] (Translator, 1:12)');
});

it('asks for fresh links when the audio has expired', async () => {
  const { onLinksExpired } = renderScreen();
  await screen.findByText('ཕྱག་ཐལ་མོ་སྦྱར་ཏེ།');

  document.querySelector('audio')?.dispatchEvent(new Event('error'));

  await waitFor(() => expect(onLinksExpired).toHaveBeenCalled());
});

it('goes on from the asked line once the expired audio link is replaced', async () => {
  const user = userEvent.setup();
  const client = new QueryClient();
  const onLinksExpired = jest.fn();
  const view = (value: api.Job) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <TranscriptScreen job={value} onLinksExpired={onLinksExpired} />
      </QueryClientProvider>
    </IntlProvider>
  );
  const { rerender } = render(view(job));
  const audio = document.querySelector('audio') as HTMLAudioElement;
  await user.click(await screen.findByRole('button', { name: 'Play from 1:02:05' }));
  const play = window.HTMLMediaElement.prototype.play as jest.Mock;
  play.mockClear();

  act(() => { audio.dispatchEvent(new Event('error')); });
  expect(onLinksExpired).toHaveBeenCalledTimes(1);
  audio.currentTime = 0; // the player starts again from the beginning with a new link

  rerender(view({ ...job, downloads: { ...job.downloads, clean: 'https://s3.example/2-clean/clean.flac?fresh' } }));

  await waitFor(() => expect(play).toHaveBeenCalled());
  expect(audio.currentTime).toBe(3725);
});

it('counts a corrected line as checked', async () => {
  const user = userEvent.setup();
  mockedApi.saveTranscriptEdit.mockResolvedValueOnce({ 2: 'དཀོན་མཆོག་གསུམ་ལ།' });
  renderScreen();
  expect(await screen.findByText(/1 to check/)).not.toBeNull();
  await user.click(screen.getByLabelText(text(messages.onlyToCheck)));
  const line = await lineAt('0:32');

  await user.click(within(line).getByRole('button', { name: 'Edit the line at 0:32' }));
  await user.click(within(line).getByRole('button', { name: text(messages.save) }));

  expect(await screen.findByText(/nothing marked to check/)).not.toBeNull();
  expect(screen.getByText(text(messages.noneToCheck))).not.toBeNull();
});

it('keeps lines that start at the same moment apart', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        start: 10, end: 12, speaker: 'no speech', text: null, warnings: [],
      },
      {
        start: 10, end: 20, speaker: 'teacher', text: 'ཀ', warnings: [],
      },
    ],
  }) as jest.Mock;
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  renderScreen();
  expect(await screen.findByText('ཀ')).not.toBeNull();
  expect(screen.getAllByRole('button', { name: 'Play from 0:10' })).toHaveLength(2);
  expect(error.mock.calls.flat().join(' ')).not.toContain('same key');
  error.mockRestore();
});
