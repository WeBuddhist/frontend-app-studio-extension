import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button, Icon } from '@openedx/paragon';
import { CheckCircle } from '@openedx/paragon/icons';

import type { Job } from '../data/api';
import { keptSections, lessonMinutes, totalMinutes } from '../data/draft';
import messages from './messages';

interface CourseReadyScreenProps {
  job: Job;
  courseId: string;
}

/**
 * The course has been added to Studio as a draft (design step 7): what was added, and the way to the course
 * outline, where the author keeps editing and publishes.
 */
const CourseReadyScreen = ({ job, courseId }: CourseReadyScreenProps) => {
  const intl = useIntl();
  const sections = keptSections(job.courseDraft);
  const lessons = sections.flatMap((section) => section.lessons);
  const minutes = totalMinutes(lessons);

  const stats: [typeof messages.sections, string][] = [
    [messages.sections, String(sections.length)],
    [messages.lessons, String(lessons.length)],
    [messages.audio, intl.formatMessage(messages.audioMinutes, { minutes })],
  ];

  return (
    <section className="recording-ready" aria-labelledby="recording-ready-title">
      <div className="recording-ready__header">
        <Icon src={CheckCircle} className="recording-ready__icon" />
        <h2 id="recording-ready-title" className="recording-ready__title">{intl.formatMessage(messages.title)}</h2>
      </div>
      <p className="recording-ready__intro">{intl.formatMessage(messages.intro)}</p>

      <dl className="recording-ready__stats">
        {stats.map(([label, value]) => (
          <div key={label.id} className="recording-ready__stat">
            <dt>{intl.formatMessage(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="recording-ready__heading">{intl.formatMessage(messages.outlineHeading)}</h3>
      <ol className="recording-ready__outline">
        {sections.map((section, index) => (
          <li key={section.id} className="recording-ready__section">
            <span className="recording-ready__section-title" lang="bo">
              {intl.formatMessage(messages.sectionTitle, { number: index + 1, title: section.title })}
            </span>
            <ul className="recording-ready__lessons">
              {section.lessons.map((lesson) => (
                <li key={lesson.id} className="recording-ready__lesson">
                  <span className="recording-ready__lesson-title" lang="bo">{lesson.title}</span>
                  <span className="recording-ready__lesson-meta">
                    {intl.formatMessage(messages.lessonMeta, { minutes: lessonMinutes(lesson) })}
                  </span>
                  <span className="recording-ready__badge">{intl.formatMessage(messages.draft)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="recording-ready__note">{intl.formatMessage(messages.editThere)}</p>
      <div className="recording-ready__actions">
        <Button variant="primary" href={`${getConfig().STUDIO_BASE_URL}/course/${courseId}`}>
          {intl.formatMessage(messages.openOutline)}
        </Button>
      </div>
    </section>
  );
};

export default CourseReadyScreen;
