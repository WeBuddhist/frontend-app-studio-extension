import type { CourseDraft, DraftLesson, DraftSection } from './api';

/**
 * The longest texts and lists Studio takes in a draft (sherab-custom-plugin's CourseDraftSerializer). The
 * shaping screen stops at these instead of letting a save fail.
 */
export const DRAFT_LIMITS = {
  title: 255,
  summary: 5000,
  /** A key point or a reflection question. */
  item: 1000,
  /** Key points, reflection questions or practice questions per lesson. */
  items: 10,
  question: 1000,
  option: 500,
  explanation: 2000,
};

export const lessonsOf = (draft: CourseDraft): DraftLesson[] => draft.sections.flatMap((section) => section.lessons);

/** The sections and lessons the course gets: only the lessons kept, and only sections that have any. */
export const keptSections = (draft: Partial<CourseDraft>): DraftSection[] => (draft.sections ?? [])
  .map((section) => ({ ...section, lessons: section.lessons.filter((lesson) => lesson.include) }))
  .filter((section) => section.lessons.length > 0);

/** A lesson's length as shown: whole minutes, at least one. */
export const lessonMinutes = (lesson: DraftLesson): number => Math.max(1, Math.round(lesson.minutes));

/** The audio of these lessons together, in whole minutes. */
export const totalMinutes = (lessons: DraftLesson[]): number => Math.round(
  lessons.reduce((total, lesson) => total + lesson.minutes, 0),
);
