import { useIntl } from '@edx/frontend-platform/i18n';
import { Container } from '@openedx/paragon';
import { useParams } from 'react-router-dom';

import messages from './messages';

/**
 * The course-from-recording tool: turns a teaching recording into this course's outline.
 * One route for the whole tool; its steps (upload, processing, review, ...) are screens inside this page,
 * and the page opens the step the course has reached.
 */
const CourseFromRecordingPage = () => {
  const intl = useIntl();
  const { courseId } = useParams<{ courseId: string }>();

  return (
    <Container size="lg" className="course-from-recording">
      <h1 className="course-from-recording__title">{intl.formatMessage(messages.title)}</h1>
      <p className="course-from-recording__course">
        {intl.formatMessage(messages.courseLabel, { courseId })}
      </p>
      <p className="course-from-recording__placeholder">{intl.formatMessage(messages.comingSoon)}</p>
    </Container>
  );
};

export default CourseFromRecordingPage;
