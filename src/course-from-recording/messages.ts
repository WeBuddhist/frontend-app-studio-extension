import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'studio-extension.courseFromRecording.title',
    defaultMessage: 'Create a course from a teaching recording',
    description: 'Heading of the course-from-recording tool.',
  },
  courseLabel: {
    id: 'studio-extension.courseFromRecording.courseLabel',
    defaultMessage: 'Course: {courseId}',
    description: 'Shows which course the recording will be turned into.',
  },
  comingSoon: {
    id: 'studio-extension.courseFromRecording.comingSoon',
    defaultMessage: 'The steps of this tool are on their way.',
    description: 'Placeholder text until the upload and processing steps are built.',
  },
});

export default messages;
