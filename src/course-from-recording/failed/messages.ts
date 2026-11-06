import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  heading: {
    id: 'studio-extension.courseFromRecording.failed.heading',
    defaultMessage: 'Processing stopped',
    description: 'Heading shown when processing a recording failed.',
  },
  recording: {
    id: 'studio-extension.courseFromRecording.failed.recording',
    defaultMessage: 'Recording: {filename}',
    description: 'Which recording failed.',
  },
  reason: {
    id: 'studio-extension.courseFromRecording.failed.reason',
    defaultMessage: 'What went wrong: {error}',
    description: 'The error reported for the failed recording.',
  },
  noReason: {
    id: 'studio-extension.courseFromRecording.failed.noReason',
    defaultMessage: 'No reason was given.',
    description: 'Shown when the failed job has no error message.',
  },
  retryHelp: {
    id: 'studio-extension.courseFromRecording.failed.retryHelp',
    defaultMessage: 'Try again continues from the step that stopped, without uploading the file again.',
    description: 'Explains what the Try again button does.',
  },
  retry: {
    id: 'studio-extension.courseFromRecording.failed.retry',
    defaultMessage: 'Try again',
    description: 'Button that queues the failed recording again.',
  },
  uploadAnother: {
    id: 'studio-extension.courseFromRecording.failed.uploadAnother',
    defaultMessage: 'Upload a different recording',
    description: 'Button that goes back to the upload form.',
  },
  retryError: {
    id: 'studio-extension.courseFromRecording.failed.retryError',
    defaultMessage: 'The recording could not be restarted. Try again in a few minutes.',
    description: 'Error when retrying the failed recording did not work.',
  },
});

export default messages;
