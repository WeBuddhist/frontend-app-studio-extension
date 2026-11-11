import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Button, Form, Icon, IconButton,
} from '@openedx/paragon';
import { Add, Close } from '@openedx/paragon/icons';

import { apiErrorMessage, buildCourse, saveCourseDraft } from '../data/api';
import type {
  CourseDraft, DraftLesson, DraftQuestion, Job,
} from '../data/api';
import {
  DRAFT_LIMITS, lessonMinutes, lessonsOf, totalMinutes,
} from '../data/draft';
import messages from './messages';

// Changes are saved this long after the author stops typing.
const SAVE_AFTER_MS = 800;
// A save that failed because Studio couldn't be reached (or was busy) is tried again this long after.
const RETRY_AFTER_MS = 5000;

/** Worth trying again by itself: no answer, or Studio busy or down. Not a refusal (400, 409...). */
const isTransient = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return !status || status >= 500 || status === 429;
};

type Message = typeof messages.title;
type SaveState = 'saved' | 'saving' | 'failed';
type ListField = 'keyPoints' | 'reflection';

const badQuestion = ({ question, options }: DraftQuestion) => {
  const texts = options.map((option) => option.trim());
  return !question.trim() || texts.includes('') || new Set(texts).size !== texts.length;
};

/** What stops the draft from being saved (Studio would refuse it), or null. */
const problemOf = (draft: CourseDraft): Message | null => {
  if (draft.sections.some((section) => !section.title.trim())) { return messages.problemSectionTitle; }
  if (lessonsOf(draft).some((lesson) => !lesson.title.trim())) { return messages.problemLessonTitle; }
  if (lessonsOf(draft).some((lesson) => lesson.mcq.some(badQuestion))) { return messages.problemQuestion; }
  return null;
};

/** The draft as Studio takes it: empty key points and reflection questions left out. */
const forSaving = (draft: CourseDraft): CourseDraft => ({
  ...draft,
  sections: draft.sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) => ({
      ...lesson,
      keyPoints: lesson.keyPoints.filter((point) => point.trim()),
      reflection: lesson.reflection.filter((question) => question.trim()),
    })),
  })),
});

interface ShapeCourseScreenProps {
  job: Job;
  /** Called with the queued job once the author asks for the course to be made. */
  onBuilt: (job: Job) => void;
  /**
   * Called with the author's latest draft when the screen closes (e.g. to confirm Start over), so the page's
   * copy of the job is current if the screen opens again: it starts from that copy.
   */
  onDraftChange: (draft: CourseDraft) => void;
}

/**
 * The course the service suggested, for the author to shape (design step 6): rename sections and lessons,
 * switch lessons off, and edit each lesson's summary, key points and questions. Where a lesson starts and
 * ends can't change here. Changes are saved as the author goes; once the teacher has reviewed the outline,
 * "Create draft course" cuts the lesson audio and adds the course to Studio, unpublished.
 */
const ShapeCourseScreen = ({ job, onBuilt, onDraftChange }: ShapeCourseScreenProps) => {
  const intl = useIntl();
  const [draft, setDraft] = useState<CourseDraft>(job.courseDraft as CourseDraft);
  const [open, setOpen] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState('');
  const [buildError, setBuildError] = useState('');
  const [building, setBuilding] = useState(false);

  // Saving: a moment after the last change the latest draft goes to Studio, one save at a time.
  const latest = useRef(draft);
  const unsaved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const running = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);

  const save = async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (running.current) {
      await running.current;
      return save();
    }
    if (!unsaved.current) { return true; }
    if (problemOf(latest.current)) { return false; }
    unsaved.current = false;
    setSaveState('saving');
    running.current = saveCourseDraft(job.id, forSaving(latest.current)).then(() => true, (error) => {
      unsaved.current = true;
      setSaveError(apiErrorMessage(error, intl.formatMessage(messages.saveError)));
      // Studio unreachable or busy: try again by itself. A refusal waits for the author's next change.
      if (isTransient(error) && mounted.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { save(); }, RETRY_AFTER_MS);
      }
      return false;
    });
    const ok = await running.current;
    running.current = null;
    if (!ok) {
      setSaveState('failed');
      return false;
    }
    if (unsaved.current) { return save(); }
    setSaveState('saved');
    setSaveError('');
    return true;
  };

  // Leaving the screen: send what isn't saved yet, hand the page the latest draft, and warn before closing
  // the tab with unsaved changes.
  useEffect(() => {
    mounted.current = true; // again after React's development double mount
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved.current) { event.preventDefault(); }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      mounted.current = false;
      window.removeEventListener('beforeunload', warn);
      if (unsaved.current) { save(); }
      onDraftChange(latest.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (next: CourseDraft) => {
    latest.current = next;
    unsaved.current = true;
    setDraft(next);
    setBuildError('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { save(); }, SAVE_AFTER_MS);
  };

  const setSectionTitle = (sectionId: string, title: string) => change({
    ...latest.current,
    sections: latest.current.sections.map((section) => (section.id === sectionId ? { ...section, title } : section)),
  });

  const updateLesson = (lessonId: string, update: (lesson: DraftLesson) => Partial<DraftLesson>) => change({
    ...latest.current,
    sections: latest.current.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...update(lesson) } : lesson)),
    })),
  });

  const setListItem = (lessonId: string, field: ListField, index: number, value: string) => updateLesson(
    lessonId,
    (lesson) => ({ [field]: lesson[field].map((item, at) => (at === index ? value : item)) }),
  );
  const addListItem = (lessonId: string, field: ListField) => updateLesson(
    lessonId,
    (lesson) => ({ [field]: [...lesson[field], ''] }),
  );
  const removeListItem = (lessonId: string, field: ListField, index: number) => updateLesson(
    lessonId,
    (lesson) => ({ [field]: lesson[field].filter((_, at) => at !== index) }),
  );
  const updateQuestion = (lessonId: string, index: number, update: Partial<DraftQuestion>) => updateLesson(
    lessonId,
    (lesson) => ({ mcq: lesson.mcq.map((question, at) => (at === index ? { ...question, ...update } : question)) }),
  );

  const kept = lessonsOf(draft).filter((lesson) => lesson.include);
  const keptMinutes = totalMinutes(kept);
  const problem = problemOf(draft);

  const build = async () => {
    setBuildError('');
    if (!kept.length) {
      setBuildError(intl.formatMessage(messages.keepOne));
      return;
    }
    if (problem) {
      setBuildError(intl.formatMessage(problem));
      return;
    }
    if (!approved) {
      setBuildError(intl.formatMessage(messages.approveFirst));
      return;
    }
    setBuilding(true);
    if (!(await save())) {
      setBuilding(false);
      return;
    }
    try {
      onBuilt(await buildCourse(job.id));
    } catch (error) {
      setBuildError(apiErrorMessage(error, intl.formatMessage(messages.createError)));
      setBuilding(false);
    }
  };

  // A list of short texts (key points, reflection questions), each with a Remove button, and an Add button.
  const textList = (lesson: DraftLesson, field: ListField, legend: Message, item: Message, add: Message) => (
    <fieldset className="recording-shape__group">
      <legend className="recording-shape__legend">{intl.formatMessage(legend)}</legend>
      {lesson[field].map((value, index) => {
        const name = intl.formatMessage(item, { number: index + 1 });
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="recording-shape__item">
            <Form.Control
              lang="bo"
              value={value}
              maxLength={DRAFT_LIMITS.item}
              placeholder={name}
              aria-label={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => (
                setListItem(lesson.id, field, index, event.target.value)
              )}
            />
            <IconButton
              src={Close}
              iconAs={Icon}
              size="sm"
              alt={intl.formatMessage(messages.remove, { item: name })}
              onClick={() => removeListItem(lesson.id, field, index)}
            />
          </div>
        );
      })}
      {/* Studio takes up to ten. */}
      {lesson[field].length < DRAFT_LIMITS.items && (
        <Button
          variant="link"
          size="sm"
          iconBefore={Add}
          className="recording-shape__add"
          onClick={() => addListItem(lesson.id, field)}
        >
          {intl.formatMessage(add)}
        </Button>
      )}
    </fieldset>
  );

  const questionEditor = (lesson: DraftLesson, question: DraftQuestion, index: number) => {
    const number = index + 1;
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={index} className="recording-shape__question">
        <div className="recording-shape__item">
          <Form.Control
            lang="bo"
            value={question.question}
            maxLength={DRAFT_LIMITS.question}
            aria-label={intl.formatMessage(messages.question, { number })}
            onChange={(event: ChangeEvent<HTMLInputElement>) => (
              updateQuestion(lesson.id, index, { question: event.target.value })
            )}
          />
          <IconButton
            src={Close}
            iconAs={Icon}
            size="sm"
            alt={intl.formatMessage(messages.removeQuestion, { number })}
            onClick={() => updateLesson(lesson.id, (current) => ({ mcq: current.mcq.filter((_, at) => at !== index) }))}
          />
        </div>
        <ol className="recording-shape__options">
          {question.options.map((option, optionIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={optionIndex} className="recording-shape__option">
              <input
                type="radio"
                name={`recording-shape-${lesson.id}-q${index}`}
                checked={question.answer === optionIndex}
                aria-label={intl.formatMessage(messages.rightAnswer, { number: optionIndex + 1 })}
                onChange={() => updateQuestion(lesson.id, index, { answer: optionIndex })}
              />
              <Form.Control
                lang="bo"
                value={option}
                maxLength={DRAFT_LIMITS.option}
                aria-label={intl.formatMessage(messages.option, { question: number, number: optionIndex + 1 })}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateQuestion(lesson.id, index, {
                  options: question.options.map((text, at) => (at === optionIndex ? event.target.value : text)),
                })}
              />
            </li>
          ))}
        </ol>
        <Form.Control
          lang="bo"
          value={question.explanation}
          maxLength={DRAFT_LIMITS.explanation}
          placeholder={intl.formatMessage(messages.explanationPlaceholder)}
          aria-label={intl.formatMessage(messages.explanation, { number })}
          onChange={(event: ChangeEvent<HTMLInputElement>) => (
            updateQuestion(lesson.id, index, { explanation: event.target.value })
          )}
        />
      </div>
    );
  };

  const lessonRow = (lesson: DraftLesson, number: number) => {
    const isOpen = open === lesson.id;
    const classes = ['recording-shape__lesson', lesson.include ? '' : 'recording-shape__lesson--off'];
    return (
      <li key={lesson.id} className={classes.filter(Boolean).join(' ')}>
        <div className="recording-shape__lesson-head">
          <Form.Checkbox
            checked={lesson.include}
            className="recording-shape__include"
            onChange={(event: ChangeEvent<HTMLInputElement>) => (
              updateLesson(lesson.id, () => ({ include: event.target.checked }))
            )}
          >
            <span className="sr-only">{intl.formatMessage(messages.include, { title: lesson.title })}</span>
          </Form.Checkbox>
          <Form.Control
            lang="bo"
            value={lesson.title}
            maxLength={DRAFT_LIMITS.title}
            aria-label={intl.formatMessage(messages.lessonTitle, { number })}
            className="recording-shape__lesson-title"
            onChange={(event: ChangeEvent<HTMLInputElement>) => (
              updateLesson(lesson.id, () => ({ title: event.target.value }))
            )}
          />
          <span className="recording-shape__minutes">
            {intl.formatMessage(messages.minutes, { minutes: lessonMinutes(lesson) })}
          </span>
          <Button
            variant="tertiary"
            size="sm"
            aria-expanded={isOpen}
            aria-label={isOpen ? undefined : intl.formatMessage(messages.editLesson, { title: lesson.title })}
            onClick={() => setOpen(isOpen ? null : lesson.id)}
          >
            {intl.formatMessage(isOpen ? messages.close : messages.edit)}
          </Button>
        </div>
        {!isOpen && lesson.summary && (
          <p className="recording-shape__preview" lang="bo">{lesson.summary}</p>
        )}
        {isOpen && (
          <div className="recording-shape__details">
            <Form.Group controlId={`recording-shape-${lesson.id}-summary`}>
              <Form.Label className="recording-shape__legend">{intl.formatMessage(messages.summary)}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                lang="bo"
                value={lesson.summary}
                maxLength={DRAFT_LIMITS.summary}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => (
                  updateLesson(lesson.id, () => ({ summary: event.target.value }))
                )}
              />
            </Form.Group>
            {textList(lesson, 'keyPoints', messages.keyPoints, messages.keyPoint, messages.addKeyPoint)}
            <fieldset className="recording-shape__group">
              <legend className="recording-shape__legend">{intl.formatMessage(messages.questions)}</legend>
              {lesson.mcq.map((question, index) => questionEditor(lesson, question, index))}
            </fieldset>
            {textList(lesson, 'reflection', messages.reflection, messages.reflectionQuestion, messages.addReflection)}
          </div>
        )}
      </li>
    );
  };

  let lessonNumber = 0;
  let saveText = '';
  if (problem) {
    saveText = intl.formatMessage(problem);
  } else if (saveState === 'failed') {
    saveText = saveError;
  } else {
    saveText = intl.formatMessage(saveState === 'saving' ? messages.saving : messages.saved);
  }

  return (
    <section className="recording-shape" aria-labelledby="recording-shape-title">
      <header>
        <h2 id="recording-shape-title" className="recording-shape__title">{intl.formatMessage(messages.title)}</h2>
        <p className="recording-shape__intro">{intl.formatMessage(messages.intro)}</p>
      </header>

      {/* Locked while the course is being created: a change then would not be in it. */}
      <fieldset disabled={building} className="recording-shape__sections">
        {draft.sections.map((section, index) => (
          <div key={section.id} className="recording-shape__section">
            <Form.Group controlId={`recording-shape-${section.id}`} className="recording-shape__section-head">
              <Form.Label className="recording-shape__section-label">
                {intl.formatMessage(messages.sectionLabel, { number: index + 1 })}
              </Form.Label>
              <Form.Control
                lang="bo"
                value={section.title}
                maxLength={DRAFT_LIMITS.title}
                className="recording-shape__section-title"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSectionTitle(section.id, event.target.value)}
              />
            </Form.Group>
            <ul className="recording-shape__lessons">
              {section.lessons.map((lesson) => {
                lessonNumber += 1;
                return lessonRow(lesson, lessonNumber);
              })}
            </ul>
          </div>
        ))}
      </fieldset>

      <div className="recording-shape__footer">
        <div className="recording-shape__status">
          <span className="recording-shape__count">
            {intl.formatMessage(messages.count, { lessons: kept.length, minutes: keptMinutes })}
          </span>
          <span
            className={`recording-shape__saved${problem || saveState === 'failed' ? ' recording-shape__saved--problem' : ''}`}
            role="status"
          >
            {saveText}
          </span>
        </div>
        <Form.Checkbox
          checked={approved}
          disabled={building}
          className="recording-shape__approved"
          onChange={(event: ChangeEvent<HTMLInputElement>) => { setApproved(event.target.checked); setBuildError(''); }}
        >
          {intl.formatMessage(messages.approved)}
        </Form.Checkbox>
        {buildError && <Alert variant="danger" className="recording-shape__alert">{buildError}</Alert>}
        <div className="recording-shape__actions">
          <Button variant="primary" onClick={build} disabled={building}>
            {intl.formatMessage(building ? messages.creating : messages.create)}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ShapeCourseScreen;
