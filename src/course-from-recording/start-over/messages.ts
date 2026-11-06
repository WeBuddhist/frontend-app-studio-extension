import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  startOver: {
    id: 'studio-extension.courseFromRecording.startOver.startOver',
    defaultMessage: 'Start over',
    description: 'Link on every step that opens the start over confirmation.',
  },
  title: {
    id: 'studio-extension.courseFromRecording.startOver.title',
    defaultMessage: 'Start over?',
    description: 'Heading of the start over confirmation.',
  },
  deletedHeading: {
    id: 'studio-extension.courseFromRecording.startOver.deletedHeading',
    defaultMessage: 'Deleted for good',
    description: 'Heading of the list of what starting over deletes; it can’t be brought back.',
  },
  stopsProcessing: {
    id: 'studio-extension.courseFromRecording.startOver.stopsProcessing',
    defaultMessage: 'The work in progress (it stops straight away)',
    description: 'Deleted when starting over while the recording is being processed.',
  },
  voices: {
    id: 'studio-extension.courseFromRecording.startOver.voices',
    defaultMessage: 'The voices that were found, and your tags',
    description: 'Deleted when starting over.',
  },
  cleanAudio: {
    id: 'studio-extension.courseFromRecording.startOver.cleanAudio',
    defaultMessage: 'The cleaned audio',
    description: 'Deleted when starting over.',
  },
  transcript: {
    id: 'studio-extension.courseFromRecording.startOver.transcript',
    defaultMessage: 'The transcript',
    description: 'Deleted when starting over.',
  },
  progressSoFar: {
    id: 'studio-extension.courseFromRecording.startOver.progressSoFar',
    defaultMessage: 'The progress so far',
    description: 'Deleted when starting over before anything was made.',
  },
  recording: {
    id: 'studio-extension.courseFromRecording.startOver.recording',
    defaultMessage: 'The uploaded recording',
    description: 'Deleted when starting over with a different recording.',
  },
  paidMinutes: {
    id: 'studio-extension.courseFromRecording.startOver.paidMinutes',
    defaultMessage: '{minutes, plural, one {# minute} other {# minutes}} of this recording were already transcribed. If you transcribe them again, they are paid for again.',
    description: 'Warning on the start over confirmation when transcription was already paid for.',
  },
  choiceLabel: {
    id: 'studio-extension.courseFromRecording.startOver.choiceLabel',
    defaultMessage: 'Which recording do you want to use?',
    description: 'Label of the choice between keeping the recording or using another.',
  },
  keepRecording: {
    id: 'studio-extension.courseFromRecording.startOver.keepRecording',
    defaultMessage: 'The same recording',
    description: 'Start over with the recording already uploaded.',
  },
  keepRecordingHelp: {
    id: 'studio-extension.courseFromRecording.startOver.keepRecordingHelp',
    defaultMessage: 'Correct the details, then start again without uploading it again.',
    description: 'Explains keeping the recording when starting over.',
  },
  differentRecording: {
    id: 'studio-extension.courseFromRecording.startOver.differentRecording',
    defaultMessage: 'A different recording',
    description: 'Start over with another recording.',
  },
  differentRecordingHelp: {
    id: 'studio-extension.courseFromRecording.startOver.differentRecordingHelp',
    defaultMessage: 'The uploaded recording is deleted too.',
    description: 'Explains choosing a different recording when starting over.',
  },
  cancel: {
    id: 'studio-extension.courseFromRecording.startOver.cancel',
    defaultMessage: 'Cancel',
    description: 'Closes the start over confirmation without changing anything.',
  },
  confirm: {
    id: 'studio-extension.courseFromRecording.startOver.confirm',
    defaultMessage: 'Delete and start over',
    description: 'Button that deletes the work so far and starts over.',
  },
  deleting: {
    id: 'studio-extension.courseFromRecording.startOver.deleting',
    defaultMessage: 'Deleting…',
    description: 'Shown on the button while starting over.',
  },
  error: {
    id: 'studio-extension.courseFromRecording.startOver.error',
    defaultMessage: 'Starting over did not work. Try again in a few minutes.',
    description: 'Error when starting over failed.',
  },
});

export default messages;
