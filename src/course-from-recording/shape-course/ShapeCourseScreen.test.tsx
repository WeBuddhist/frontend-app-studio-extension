import { IntlProvider } from '@edx/frontend-platform/i18n';
import {
  act, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as api from '../data/api';
import ShapeCourseScreen from './ShapeCourseScreen';
import messages from './messages';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  saveCourseDraft: jest.fn(),
  buildCourse: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const text = (message: { defaultMessage?: string }) => message.defaultMessage as string;

const lesson = (id: string, title: string, minutes: number, include = true): api.DraftLesson => ({
  id,
  title,
  include,
  firstLine: 0,
  lastLine: 1,
  start: 0,
  end: minutes * 60,
  minutes,
  summary: `${title}་གྱི་བསྡུས་དོན།`,
  keyPoints: ['གནད་དང་པོ།', 'གནད་གཉིས་པ།'],
  mcq: [{
    question: 'སྐྱབས་གནས་གང་ཡིན།', options: ['སངས་རྒྱས།', 'དཀོན་མཆོག་གསུམ།', 'བླ་མ།'], answer: 1, explanation: 'རྒྱུ་མཚན།',
  }],
  reflection: ['བསམ་ཞིབ།'],
});

const draft = (): api.CourseDraft => ({
  version: 1,
  courseTitle: 'སྤྱོད་འཇུག',
  sections: [
    { id: 's1', title: 'ལེའུ་དང་པོ།', lessons: [lesson('s1-l1', 'སྐྱབས་འགྲོ།', 9.4), lesson('s1-l2', 'སེམས་བསྐྱེད།', 11.2)] },
    { id: 's2', title: 'ལེའུ་གཉིས་པ།', lessons: [lesson('s2-l1', 'བསྔོ་བ།', 4.6)] },
  ],
});

const job = { id: 'job-1', status: 'course_draft_ready', courseDraft: draft() } as unknown as api.Job;

const onDraftChange = jest.fn();

const renderScreen = () => {
  const onBuilt = jest.fn();
  const { unmount } = render(
    <IntlProvider locale="en">
      <ShapeCourseScreen job={job} onBuilt={onBuilt} onDraftChange={onDraftChange} />
    </IntlProvider>,
  );
  return Object.assign(onBuilt, { unmount });
};

const lessonRow = (title: string) => screen.getByDisplayValue(title).closest('li') as HTMLElement;
const lastSaved = () => mockedApi.saveCourseDraft.mock.calls[mockedApi.saveCourseDraft.mock.calls.length - 1][1];

beforeEach(() => {
  jest.resetAllMocks();
  mockedApi.saveCourseDraft.mockImplementation(async (_id, saved) => saved);
});

it('shows the sections and lessons, with their length and summary', () => {
  renderScreen();

  expect(screen.getByRole('heading', { name: text(messages.title) })).not.toBeNull();
  expect(screen.getByDisplayValue('ལེའུ་དང་པོ།')).not.toBeNull();
  expect(screen.getByText('Section 2')).not.toBeNull();
  expect(within(lessonRow('སེམས་བསྐྱེད།')).getByText('11 min')).not.toBeNull();
  expect(screen.getByText('སྐྱབས་འགྲོ།་གྱི་བསྡུས་དོན།')).not.toBeNull();
  expect(screen.getByText('3 lessons · 25 min of audio')).not.toBeNull();
});

it('saves a renamed lesson a moment after typing', async () => {
  const user = userEvent.setup();
  renderScreen();

  const title = screen.getByRole('textbox', { name: 'Title of lesson 2' });
  await user.clear(title);
  await user.type(title, 'བྱང་ཆུབ་སེམས།');

  await waitFor(() => expect(mockedApi.saveCourseDraft).toHaveBeenCalled(), { timeout: 2000 });
  expect(mockedApi.saveCourseDraft).toHaveBeenCalledTimes(1); // once, after the typing stopped
  expect(lastSaved().sections[0].lessons[1].title).toBe('བྱང་ཆུབ་སེམས།');
  expect(await screen.findByText(text(messages.saved))).not.toBeNull();
});

it('switching a lesson off leaves it out of the count', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(within(lessonRow('བསྔོ་བ།')).getByRole('checkbox'));

  expect(screen.getByText('2 lessons · 21 min of audio')).not.toBeNull();
  await waitFor(() => expect(mockedApi.saveCourseDraft).toHaveBeenCalled(), { timeout: 2000 });
  expect(lastSaved().sections[1].lessons[0].include).toBe(false);
});

it('edits a lesson’s questions, key points and reflection questions', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(screen.getByRole('button', { name: 'Edit the lesson “སྐྱབས་འགྲོ།”' }));
  const row = lessonRow('སྐྱབས་འགྲོ།');
  await user.click(within(row).getByRole('radio', { name: 'Option 3 is the right answer' }));
  await user.click(within(row).getByRole('button', { name: 'Remove Key point 1' }));
  await user.click(within(row).getByRole('button', { name: text(messages.addReflection) }));
  await user.type(within(row).getByRole('textbox', { name: 'Reflection question 2' }), 'བསམ་ཞིབ་གསར་པ།');
  await user.click(within(row).getByRole('button', { name: text(messages.addKeyPoint) })); // left empty

  await waitFor(() => expect(lastSaved()?.sections[0].lessons[0].reflection).toHaveLength(2), { timeout: 2000 });
  const saved = lastSaved().sections[0].lessons[0];
  expect(saved.mcq[0].answer).toBe(2);
  expect(saved.keyPoints).toEqual(['གནད་གཉིས་པ།']); // the empty key point isn't sent
  expect(saved.reflection).toEqual(['བསམ་ཞིབ།', 'བསམ་ཞིབ་གསར་པ།']);
});

it('doesn’t save a lesson without a title, and says why', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.clear(screen.getByRole('textbox', { name: 'Title of lesson 1' }));

  expect(screen.getByRole('status').textContent).toBe(text(messages.problemLessonTitle));
  await new Promise((resolve) => { setTimeout(resolve, 1000); });
  expect(mockedApi.saveCourseDraft).not.toHaveBeenCalled();

  await user.click(screen.getByLabelText(text(messages.approved)));
  await user.click(screen.getByRole('button', { name: text(messages.create) }));
  expect(screen.getByRole('alert').textContent).toBe(text(messages.problemLessonTitle));
  expect(mockedApi.buildCourse).not.toHaveBeenCalled();
});

it('making the course needs the teacher’s review and a lesson', async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(screen.getByRole('button', { name: text(messages.create) }));
  expect(screen.getByRole('alert').textContent).toBe(text(messages.approveFirst));

  for (const title of ['སྐྱབས་འགྲོ།', 'སེམས་བསྐྱེད།', 'བསྔོ་བ།']) {
    // eslint-disable-next-line no-await-in-loop
    await user.click(within(lessonRow(title)).getByRole('checkbox'));
  }
  await user.click(screen.getByLabelText(text(messages.approved)));
  await user.click(screen.getByRole('button', { name: text(messages.create) }));
  expect(screen.getByRole('alert').textContent).toBe(text(messages.keepOne));
  expect(mockedApi.buildCourse).not.toHaveBeenCalled();
});

it('saves the last changes, then makes the course', async () => {
  const user = userEvent.setup();
  const order: string[] = [];
  mockedApi.saveCourseDraft.mockImplementation(async (_id, saved) => { order.push('save'); return saved; });
  mockedApi.buildCourse.mockImplementation(async () => {
    order.push('build');
    return { ...job, status: 'queued', courseApproved: true } as api.Job;
  });
  const onBuilt = renderScreen();

  await user.type(screen.getByRole('textbox', { name: 'Title of lesson 3' }), '།');
  await user.click(screen.getByLabelText(text(messages.approved)));
  await user.click(screen.getByRole('button', { name: text(messages.create) }));

  await waitFor(() => expect(onBuilt).toHaveBeenCalledWith(expect.objectContaining({ courseApproved: true })));
  expect(order).toEqual(['save', 'build']);
  expect(lastSaved().sections[1].lessons[0].title).toBe('བསྔོ་བ།།');
});

it('says when the course could not be started, and lets the author try again', async () => {
  const user = userEvent.setup();
  mockedApi.buildCourse.mockRejectedValue({ response: { data: { error: 'This course has already been created.' } } });
  renderScreen();

  await user.click(screen.getByLabelText(text(messages.approved)));
  await user.click(screen.getByRole('button', { name: text(messages.create) }));

  expect(await screen.findByText('This course has already been created.')).not.toBeNull();
  expect(screen.getByRole('button', { name: text(messages.create) })).toHaveProperty('disabled', false);
});

it('hands the page the latest draft when the screen closes', async () => {
  const user = userEvent.setup();
  const { unmount } = renderScreen();

  await user.type(screen.getByRole('textbox', { name: 'Title of lesson 3' }), '།');
  unmount();

  expect(onDraftChange.mock.calls[0][0].sections[1].lessons[0].title).toBe('བསྔོ་བ།།');
  expect(lastSaved().sections[1].lessons[0].title).toBe('བསྔོ་བ།།'); // and sends it
});

describe('a save that fails', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const typeAndWait = async (milliseconds: number) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByRole('textbox', { name: 'Title of lesson 3' }), '།');
    await act(async () => { jest.advanceTimersByTime(milliseconds); });
  };

  it('is tried again by itself when Studio couldn’t be reached', async () => {
    mockedApi.saveCourseDraft.mockRejectedValueOnce(new Error('Network Error'));
    renderScreen();

    await typeAndWait(1000);
    expect(screen.getByRole('status').textContent).toBe(text(messages.saveError));

    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(mockedApi.saveCourseDraft).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status').textContent).toBe(text(messages.saved));
  });

  it('shows Studio’s reason when it refused, wherever in the draft it is, and waits for a change', async () => {
    mockedApi.saveCourseDraft.mockRejectedValue({
      response: { status: 400, data: { sections: [{}, { lessons: [{ summary: ['Too long.'] }] }] } },
    });
    renderScreen();

    await typeAndWait(1000);
    expect(screen.getByRole('status').textContent).toBe('Too long.');

    await act(async () => { jest.advanceTimersByTime(10000); });
    expect(mockedApi.saveCourseDraft).toHaveBeenCalledTimes(1);
  });
});

it('stops at what Studio takes: text lengths, and ten key points', async () => {
  const user = userEvent.setup();
  renderScreen();

  expect(screen.getByRole('textbox', { name: 'Title of lesson 1' }).getAttribute('maxlength')).toBe('255');
  await user.click(screen.getByRole('button', { name: 'Edit the lesson “སྐྱབས་འགྲོ།”' }));
  const row = lessonRow('སྐྱབས་འགྲོ།');
  for (let added = 0; added < 8; added += 1) {
    // eslint-disable-next-line no-await-in-loop
    await user.click(within(row).getByRole('button', { name: text(messages.addKeyPoint) }));
  }
  expect(within(row).getAllByRole('textbox', { name: /^Key point/ })).toHaveLength(10);
  expect(within(row).queryByRole('button', { name: text(messages.addKeyPoint) })).toBeNull();
});

it('locks the draft while the course is being created', async () => {
  const user = userEvent.setup();
  mockedApi.buildCourse.mockReturnValue(new Promise(() => {}));
  renderScreen();

  await user.click(screen.getByLabelText(text(messages.approved)));
  await user.click(screen.getByRole('button', { name: text(messages.create) }));

  await waitFor(() => expect(mockedApi.buildCourse).toHaveBeenCalled());
  // Disabled by the fieldset around the draft.
  expect(screen.getByRole('textbox', { name: 'Title of lesson 1' }).matches(':disabled')).toBe(true);
  expect(screen.getByLabelText(text(messages.approved))).toHaveProperty('disabled', true);
});
