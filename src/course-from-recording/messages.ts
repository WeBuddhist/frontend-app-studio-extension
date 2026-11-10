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
  loading: {
    id: 'studio-extension.courseFromRecording.loading',
    defaultMessage: 'Loading…',
    description: 'Screen-reader text while the course’s recording job is loading.',
  },
  loadError: {
    id: 'studio-extension.courseFromRecording.loadError',
    defaultMessage: 'This tool could not be opened. Try again in a few minutes.',
    description: 'Error when the course’s recording job could not be loaded.',
  },
  stepsLabel: {
    id: 'studio-extension.courseFromRecording.stepsLabel',
    defaultMessage: 'Steps',
    description: 'Accessible name of the step bar at the top of the tool.',
  },
  stepUpload: {
    id: 'studio-extension.courseFromRecording.stepUpload',
    defaultMessage: 'Upload',
    description: 'Step in the step bar.',
  },
  stepFindSpeakers: {
    id: 'studio-extension.courseFromRecording.stepFindSpeakers',
    defaultMessage: 'Find voices',
    description: 'Step in the step bar: split the recording by speaker.',
  },
  stepTagVoices: {
    id: 'studio-extension.courseFromRecording.stepTagVoices',
    defaultMessage: 'Tag voices',
    description: 'Step in the step bar: the author says which voice is the teacher.',
  },
  stepClean: {
    id: 'studio-extension.courseFromRecording.stepClean',
    defaultMessage: 'Clean',
    description: 'Step in the step bar: remove background noise.',
  },
  stepTranscribe: {
    id: 'studio-extension.courseFromRecording.stepTranscribe',
    defaultMessage: 'Transcribe',
    description: 'Step in the step bar.',
  },
  stepTranscript: {
    id: 'studio-extension.courseFromRecording.stepTranscript',
    defaultMessage: 'Transcript',
    description: 'Last step in the step bar: the finished transcript.',
  },
  stepShape: {
    id: 'studio-extension.courseFromRecording.stepShape',
    defaultMessage: 'Shape course',
    description: 'Step in the step bar: the author shapes the suggested course.',
  },
  stepCourse: {
    id: 'studio-extension.courseFromRecording.stepCourse',
    defaultMessage: 'Draft course',
    description: 'Last step in the step bar: the course is added to Studio as a draft.',
  },
  stepDone: {
    id: 'studio-extension.courseFromRecording.stepDone',
    defaultMessage: '(done)',
    description: 'Read out by screen readers after the name of a finished step in the step bar.',
  },
  jobStatus: {
    id: 'studio-extension.courseFromRecording.jobStatus',
    defaultMessage: 'Your recording: {status}',
    description: 'Where the recording is in processing, until the progress screen is built.',
  },
});

export default messages;
