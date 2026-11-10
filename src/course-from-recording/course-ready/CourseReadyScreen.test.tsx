import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen, within } from '@testing-library/react';

import type { CourseDraft, DraftLesson, Job } from '../data/api';
import CourseReadyScreen from './CourseReadyScreen';
import messages from './messages';

const COURSE_ID = 'course-v1:Sherab+tspc12+2026';

const lesson = (id: string, title: string, minutes: number, include = true) => ({
  id, title, include, minutes, summary: '', keyPoints: [], mcq: [], reflection: [],
} as unknown as DraftLesson);

const draft: CourseDraft = {
  version: 1,
  courseTitle: 'སྤྱོད་འཇུག',
  sections: [
    { id: 's1', title: 'ལེའུ་དང་པོ།', lessons: [lesson('s1-l1', 'སྐྱབས་འགྲོ།', 9.4), lesson('s1-l2', 'སེམས་བསྐྱེད།', 11.2)] },
    // Every lesson of this section was switched off: it isn't in the course.
    { id: 's2', title: 'ལེའུ་གཉིས་པ།', lessons: [lesson('s2-l1', 'བསྔོ་བ།', 4.6, false)] },
  ],
};

const renderScreen = () => render(
  <IntlProvider locale="en">
    <CourseReadyScreen job={{ id: 'job-1', courseDraft: draft } as unknown as Job} courseId={COURSE_ID} />
  </IntlProvider>,
);

it('says what was added to the course, and that nothing is published', () => {
  renderScreen();

  expect(screen.getByRole('heading', { name: messages.title.defaultMessage })).not.toBeNull();
  expect(screen.getByText(messages.intro.defaultMessage as string)).not.toBeNull();
  expect(document.querySelector('.recording-ready__stats')?.textContent).toBe('Sections1Lessons2Audio21 min');
});

it('lists the sections and lessons as drafts in the outline', () => {
  renderScreen();

  expect(screen.getByText('Section 1: ལེའུ་དང་པོ།')).not.toBeNull();
  expect(screen.queryByText(/ལེའུ་གཉིས་པ།/)).toBeNull();
  const row = screen.getByText('སེམས་བསྐྱེད།').closest('li') as HTMLElement;
  expect(within(row).getByText('Audio lesson · 11 min')).not.toBeNull();
  expect(screen.getAllByText(messages.draft.defaultMessage as string)).toHaveLength(2);
});

it('opens the course outline', () => {
  renderScreen();
  const link = screen.getByRole('link', { name: messages.openOutline.defaultMessage });
  expect(link.getAttribute('href')).toMatch(new RegExp(`/course/${COURSE_ID.replace(/\+/g, '\\+')}$`));
});
