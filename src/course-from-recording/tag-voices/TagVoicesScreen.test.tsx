import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as api from '../data/api';
import TagVoicesScreen from './TagVoicesScreen';
import messages from './messages';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  tagVoices: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const TIMELINE_URL = 'https://s3.example/1-voices/timeline.json';
const WAVEFORM_URL = 'https://s3.example/1-voices/waveform.json';

const job = {
  id: 'job-1',
  status: 'needs_speaker_labels',
  downloads: { timeline: TIMELINE_URL },
  speakerGroups: [
    { group: '1', minutes: 95.4, samples: ['https://s3.example/1-a.mp3', 'https://s3.example/1-b.mp3'] },
    { group: '2', minutes: 80, samples: ['https://s3.example/2-a.mp3'] },
  ],
} as unknown as api.Job;

const TIMELINE = [
  { start: 0, end: 600, group: '1' },
  { start: 600, end: 640, group: null },
  { start: 640, end: 1200, group: '2' },
  { start: 1200, end: 1500, group: '1' },
];

// 1500 values, one a second: loud while someone speaks, silent from 600 to 640 s.
const WAVEFORM = {
  seconds_per_level: 1,
  levels: Array.from({ length: 1500 }, (_, second) => (second >= 600 && second < 640 ? 0 : 0.8)),
};

const FILES: Record<string, unknown> = { [TIMELINE_URL]: TIMELINE, [WAVEFORM_URL]: WAVEFORM };

const text = (message: { defaultMessage?: string }) => message.defaultMessage as string;

const renderScreen = (value: api.Job = job) => {
  const onTagged = jest.fn();
  const onSamplesExpired = jest.fn();
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={new QueryClient()}>
        <TagVoicesScreen job={value} onTagged={onTagged} onSamplesExpired={onSamplesExpired} />
      </QueryClientProvider>
    </IntlProvider>,
  );
  return { onTagged, onSamplesExpired };
};

const whoToggle = (voice: string) => screen.getByRole('button', { name: new RegExp(`^Who is ${voice}\\?`) });

// Open the voice's "Who is this?" menu and pick an option.
const tag = async (user: ReturnType<typeof userEvent.setup>, voice: string, label: string) => {
  const toggle = whoToggle(voice);
  await user.click(toggle);
  await user.click(within(toggle.parentElement as HTMLElement).getByRole('button', { name: new RegExp(`^${label}`) }));
};

const submit = (user: ReturnType<typeof userEvent.setup>) => user.click(
  screen.getByRole('button', { name: text(messages.submit) }),
);

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  global.fetch = jest.fn(async (url: string) => ({ ok: true, json: async () => FILES[url] })) as jest.Mock;
});

it('lists every voice with a play button, how long it speaks, and a choice of who it is', () => {
  renderScreen();

  expect(screen.getByText(/^We found 2 voices in this recording\./)).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Play a sample of Voice 1' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Play a sample of Voice 2' })).not.toBeNull();
  expect(screen.getByText(/95 min/)).not.toBeNull();
  expect(screen.getByText(/Sample 1 of 2/)).not.toBeNull();
  // Voice 2 has one sample: no "Hear another".
  expect(screen.getAllByRole('button', { name: text(messages.hearAnother) })).toHaveLength(1);
  expect(whoToggle('Voice 2').textContent).toBe(text(messages.chooseWho));
});

it('shows short voices in seconds', () => {
  renderScreen({ ...job, speakerGroups: [{ group: '1', minutes: 0.42, samples: ['https://s3.example/1-a.mp3'] }] });
  expect(screen.getByText('25 s')).not.toBeNull();
});

it('shows where each voice speaks, named by its tag once tagged', async () => {
  const user = userEvent.setup();
  renderScreen();
  const strip = await screen.findByRole('img', { name: text(messages.timelineLabel) });
  const blockNames = () => [...strip.children].map((block) => block.textContent);

  // Neighbouring turns of one voice are one block; silences are blank.
  expect(blockNames()).toEqual(['Voice 1', '', 'Voice 2', 'Voice 1']);
  expect(screen.getByText('25:00')).not.toBeNull();

  await tag(user, 'Voice 1', 'Teacher');
  expect(blockNames()).toEqual(['Teacher', '', 'Voice 2', 'Teacher']);
  expect(global.fetch).toHaveBeenCalledWith(TIMELINE_URL);
});

it('works without a timeline', () => {
  renderScreen({ ...job, downloads: {} });
  expect(screen.queryByRole('img', { name: text(messages.timelineLabel) })).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});

it('plays a voice, and another of its samples on request', async () => {
  const user = userEvent.setup();
  renderScreen();
  const src = () => document.querySelector('audio')?.getAttribute('src');

  await user.click(screen.getByRole('button', { name: 'Play a sample of Voice 1' }));
  expect(src()).toBe('https://s3.example/1-a.mp3');
  expect(screen.getByRole('button', { name: 'Pause Voice 1' }).getAttribute('aria-pressed')).toBe('true');

  await user.click(screen.getByRole('button', { name: text(messages.hearAnother) }));
  expect(src()).toBe('https://s3.example/1-b.mp3');
  expect(screen.getByText(/Sample 2 of 2/)).not.toBeNull();
});

it('says how much teaching will be written down', async () => {
  const user = userEvent.setup();
  renderScreen();

  expect(screen.getByText(text(messages.noTeacherYet))).not.toBeNull();
  await tag(user, 'Voice 1', 'Teacher');
  expect(screen.getByText(/^About 95 min of teaching will be written down\./)).not.toBeNull();
});

it('asks for every voice to be tagged before continuing', async () => {
  const user = userEvent.setup();
  renderScreen();

  await tag(user, 'Voice 1', 'Teacher');
  await submit(user);

  expect(screen.getAllByText(text(messages.errorUntagged))).toHaveLength(1);
  expect(mockedApi.tagVoices).not.toHaveBeenCalled();
});

it('needs at least one teacher', async () => {
  const user = userEvent.setup();
  renderScreen();

  await tag(user, 'Voice 1', 'Translator');
  await tag(user, 'Voice 2', 'Chanting or prayers');
  await submit(user);

  expect(screen.getByText(text(messages.errorNoTeacher))).not.toBeNull();
  expect(mockedApi.tagVoices).not.toHaveBeenCalled();
});

it('saves the tags and continues', async () => {
  const user = userEvent.setup();
  const queued = { ...job, status: 'queued' } as api.Job;
  mockedApi.tagVoices.mockResolvedValue(queued);
  const { onTagged } = renderScreen();

  await tag(user, 'Voice 1', 'Teacher');
  await tag(user, 'Voice 2', 'Translator');
  await submit(user);

  await waitFor(() => expect(onTagged).toHaveBeenCalledWith(queued));
  expect(mockedApi.tagVoices).toHaveBeenCalledWith('job-1', { 1: 'teacher', 2: 'translator' });
});

it('shows Studio’s reason when the tags are refused', async () => {
  const user = userEvent.setup();
  mockedApi.tagVoices.mockRejectedValue({ response: { data: { labels: ['Tag every voice, and only the voices that were found.'] } } });
  const { onTagged } = renderScreen();

  await tag(user, 'Voice 1', 'Teacher');
  await tag(user, 'Voice 2', 'Teacher');
  await submit(user);

  expect(await screen.findByText('Tag every voice, and only the voices that were found.')).not.toBeNull();
  expect(onTagged).not.toHaveBeenCalled();
});

it('deepens a voice once tagged, and highlights the voice whose row is hovered', async () => {
  const user = userEvent.setup();
  renderScreen();
  const strip = await screen.findByRole('img', { name: text(messages.timelineLabel) });
  const classes = () => [...strip.children].map((block) => block.className);

  await tag(user, 'Voice 1', 'Teacher');
  expect(classes()[0]).toContain('--tagged');
  expect(classes()[2]).not.toContain('--tagged');

  await user.hover(document.querySelectorAll('.recording-voices__voice')[1]);
  expect(classes()[0]).toContain('--dim');
  expect(classes()[2]).not.toContain('--dim');
});

it('marks where each part starts, leaving out marks that would crowd', async () => {
  renderScreen();
  await screen.findByRole('img', { name: text(messages.timelineLabel) });
  // Parts start at 0:00, 10:00, 10:40 and 20:00; 10:40 is too close to 10:00. The end is 25:00.
  expect([...document.querySelectorAll('.recording-voices__tick')].map((tick) => tick.textContent))
    .toEqual(['0:00', '10:00', '20:00', '25:00']);
});

it('says what each choice means, and shows the answer once chosen', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(whoToggle('Voice 1'));
  const menu = whoToggle('Voice 1').parentElement as HTMLElement;
  expect(within(menu).getByRole('button', { name: /^Teacher/ }).textContent).toContain(text(messages.writtenDown));
  expect(within(menu).getByRole('button', { name: /^Translator/ }).textContent).toContain(text(messages.notWrittenDown));

  await user.click(within(menu).getByRole('button', { name: /^Translator/ }));
  expect(whoToggle('Voice 1').textContent).toBe('Translator');
  expect(whoToggle('Voice 1').className).toContain('--chosen');
});

it('draws the waveform inside each part, quiet where no one speaks', async () => {
  renderScreen({ ...job, downloads: { timeline: TIMELINE_URL, waveform: WAVEFORM_URL } });
  const strip = await screen.findByRole('img', { name: text(messages.timelineLabel) });
  await waitFor(() => expect(strip.className).toContain('--wave'));

  const heights = [...strip.children].map((block) => [...block.querySelectorAll('rect')]
    .map((bar) => Number(bar.getAttribute('height'))));
  // 200 bars over 25 minutes, shared out by time: 80 for the first 10 minutes, 5 for the silence...
  expect(heights.map((bars) => bars.length)).toEqual([80, 5, 75, 40]);
  expect(Math.max(...heights[1])).toBe(4);
  expect(Math.min(...heights[0])).toBe(80);
  // ... and the names still show.
  expect([...strip.children].map((block) => block.textContent)).toEqual(['Voice 1', '', 'Voice 2', 'Voice 1']);
});

it('keeps the plain strip when there is no waveform', async () => {
  renderScreen();
  const strip = await screen.findByRole('img', { name: text(messages.timelineLabel) });
  expect(strip.className).not.toContain('--wave');
  expect(strip.querySelector('svg')).toBeNull();
});
