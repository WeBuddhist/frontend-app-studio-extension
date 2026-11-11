import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'studio-extension.courseFromRecording.tagVoices.title',
    defaultMessage: 'Who is speaking?',
    description: 'Title of the screen where the author tags each voice.',
  },
  intro: {
    id: 'studio-extension.courseFromRecording.tagVoices.intro',
    defaultMessage: 'We found {count, plural, one {# voice} other {# voices}} in this recording. Play each one and choose who it is. Only the teacher is written down.',
    description: 'Explains the tag voices screen.',
  },
  voiceName: {
    id: 'studio-extension.courseFromRecording.tagVoices.voiceName',
    defaultMessage: 'Voice {number}',
    description: 'Name of one voice the service found.',
  },
  durationSeconds: {
    id: 'studio-extension.courseFromRecording.tagVoices.durationSeconds',
    defaultMessage: '{seconds} s',
    description: 'How long a voice speaks, for a short voice.',
  },
  durationMinutes: {
    id: 'studio-extension.courseFromRecording.tagVoices.durationMinutes',
    defaultMessage: '{minutes} min',
    description: 'How long a voice speaks.',
  },
  playVoice: {
    id: 'studio-extension.courseFromRecording.tagVoices.playVoice',
    defaultMessage: 'Play a sample of {voice}',
    description: 'Accessible name of the play button of one voice.',
  },
  pauseVoice: {
    id: 'studio-extension.courseFromRecording.tagVoices.pauseVoice',
    defaultMessage: 'Pause {voice}',
    description: 'Accessible name of the play button while its sample plays.',
  },
  sampleOf: {
    id: 'studio-extension.courseFromRecording.tagVoices.sampleOf',
    defaultMessage: 'Sample {number} of {count}',
    description: 'Which of a voice’s samples the play button plays.',
  },
  hearAnother: {
    id: 'studio-extension.courseFromRecording.tagVoices.hearAnother',
    defaultMessage: 'Hear another',
    description: 'Link that plays the next sample of a voice.',
  },
  chooseWho: {
    id: 'studio-extension.courseFromRecording.tagVoices.chooseWho',
    defaultMessage: 'Who is this?',
    description: 'Empty first option of the choice of who a voice is.',
  },
  whoIsThisVoice: {
    id: 'studio-extension.courseFromRecording.tagVoices.whoIsThisVoice',
    defaultMessage: 'Who is {voice}?',
    description: 'Accessible name of the tag choices of one voice.',
  },
  timelineLabel: {
    id: 'studio-extension.courseFromRecording.tagVoices.timelineLabel',
    defaultMessage: 'Where each voice speaks in the recording',
    description: 'Accessible name of the coloured timeline of the recording.',
  },
  silence: {
    id: 'studio-extension.courseFromRecording.tagVoices.silence',
    defaultMessage: 'Silence',
    description: 'A silent stretch on the timeline.',
  },
  teacherSummary: {
    id: 'studio-extension.courseFromRecording.tagVoices.teacherSummary',
    defaultMessage: 'About {duration} of teaching will be written down. Nothing is deleted from the original.',
    description: 'How much will be transcribed, shown next to the continue button.',
  },
  noTeacherYet: {
    id: 'studio-extension.courseFromRecording.tagVoices.noTeacherYet',
    defaultMessage: 'Tag the teacher’s voice to continue.',
    description: 'Shown next to the continue button until a voice is tagged as the teacher.',
  },
  writtenDown: {
    id: 'studio-extension.courseFromRecording.tagVoices.writtenDown',
    defaultMessage: 'Written down',
    description: 'Under the Teacher choice: this voice is transcribed.',
  },
  notWrittenDown: {
    id: 'studio-extension.courseFromRecording.tagVoices.notWrittenDown',
    defaultMessage: 'Not written down',
    description: 'Under the other choices: this voice is not transcribed.',
  },
  labelTeacher: {
    id: 'studio-extension.courseFromRecording.tagVoices.labelTeacher',
    defaultMessage: 'Teacher',
    description: 'Tag for the teacher’s voice.',
  },
  labelTranslator: {
    id: 'studio-extension.courseFromRecording.tagVoices.labelTranslator',
    defaultMessage: 'Translator',
    description: 'Tag for the translator’s voice.',
  },
  labelChanting: {
    id: 'studio-extension.courseFromRecording.tagVoices.labelChanting',
    defaultMessage: 'Chanting or prayers',
    description: 'Tag for chanting or prayers.',
  },
  labelOther: {
    id: 'studio-extension.courseFromRecording.tagVoices.labelOther',
    defaultMessage: 'Something else',
    description: 'Tag for any other voice or sound.',
  },
  splitTip: {
    id: 'studio-extension.courseFromRecording.tagVoices.splitTip',
    defaultMessage: 'Tip: one person’s voice is sometimes split in two. If two voices are both the teacher, tag both as Teacher.',
    description: 'Tip shown on the tag voices screen.',
  },
  submit: {
    id: 'studio-extension.courseFromRecording.tagVoices.submit',
    defaultMessage: 'Write down the teaching',
    description: 'Button that saves the tags and continues processing.',
  },
  saving: {
    id: 'studio-extension.courseFromRecording.tagVoices.saving',
    defaultMessage: 'Saving…',
    description: 'Shown on the button while the tags are saved.',
  },
  errorUntagged: {
    id: 'studio-extension.courseFromRecording.tagVoices.errorUntagged',
    defaultMessage: 'Say who this is.',
    description: 'Error under a voice that has no tag.',
  },
  errorNoTeacher: {
    id: 'studio-extension.courseFromRecording.tagVoices.errorNoTeacher',
    defaultMessage: 'Tag at least one voice as the teacher.',
    description: 'Error when no voice is tagged as the teacher.',
  },
  errorSave: {
    id: 'studio-extension.courseFromRecording.tagVoices.errorSave',
    defaultMessage: 'The tags could not be saved. Try again in a few minutes.',
    description: 'Error when saving the tags failed.',
  },
});

export default messages;
