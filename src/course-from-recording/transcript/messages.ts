import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'studio-extension.courseFromRecording.transcript.title',
    defaultMessage: 'Check the written teaching',
    description: 'Title of the transcript screen.',
  },
  intro: {
    id: 'studio-extension.courseFromRecording.transcript.intro',
    defaultMessage: 'Read through what was written down. Press ▶ next to a line to hear it, and use Edit on any line that is wrong. Your changes are saved as you go.',
    description: 'Explains the transcript screen.',
  },
  summary: {
    id: 'studio-extension.courseFromRecording.transcript.summary',
    defaultMessage: '{lines, plural, one {# line} other {# lines}} · {toCheck, plural, =0 {nothing marked to check} one {# to check} other {# to check}}',
    description: 'How many lines the transcript has, and how many are marked to check.',
  },
  onlyToCheck: {
    id: 'studio-extension.courseFromRecording.transcript.onlyToCheck',
    defaultMessage: 'Only lines to check',
    description: 'Switch that hides every line not marked to check.',
  },
  download: {
    id: 'studio-extension.courseFromRecording.transcript.download',
    defaultMessage: 'Download (.txt)',
    description: 'Downloads the transcript, with the author’s corrections, as a text file.',
  },
  player: {
    id: 'studio-extension.courseFromRecording.transcript.player',
    defaultMessage: 'The cleaned recording',
    description: 'Accessible name of the audio player.',
  },
  loading: {
    id: 'studio-extension.courseFromRecording.transcript.loading',
    defaultMessage: 'Loading the transcript…',
    description: 'Shown while the transcript loads.',
  },
  loadError: {
    id: 'studio-extension.courseFromRecording.transcript.loadError',
    defaultMessage: 'The transcript could not be loaded. Reload the page to try again.',
    description: 'Error when the transcript file could not be loaded.',
  },
  playFrom: {
    id: 'studio-extension.courseFromRecording.transcript.playFrom',
    defaultMessage: 'Play from {time}',
    description: 'Accessible name of a line’s time, which plays the recording from there.',
  },
  pause: {
    id: 'studio-extension.courseFromRecording.transcript.pause',
    defaultMessage: 'Pause at {time}',
    description: 'Accessible name of a line’s play button while that line is being heard.',
  },
  toCheck: {
    id: 'studio-extension.courseFromRecording.transcript.toCheck',
    defaultMessage: 'Listen and check:',
    description: 'Starts the note under a line the computer was unsure about.',
  },
  checkEmpty: {
    id: 'studio-extension.courseFromRecording.transcript.checkEmpty',
    defaultMessage: 'nothing was written down here.',
    description: 'Why a line is marked to check.',
  },
  checkMissing: {
    id: 'studio-extension.courseFromRecording.transcript.checkMissing',
    defaultMessage: 'some words may be missing.',
    description: 'Why a line is marked to check.',
  },
  checkInvented: {
    id: 'studio-extension.courseFromRecording.transcript.checkInvented',
    defaultMessage: 'there may be words that were not said.',
    description: 'Why a line is marked to check.',
  },
  checkRepeats: {
    id: 'studio-extension.courseFromRecording.transcript.checkRepeats',
    defaultMessage: 'a phrase repeats, which may be a mistake.',
    description: 'Why a line is marked to check.',
  },
  checkSplitWord: {
    id: 'studio-extension.courseFromRecording.transcript.checkSplitWord',
    defaultMessage: 'a word at the start or end may be cut.',
    description: 'Why a line is marked to check.',
  },
  notWrittenDown: {
    id: 'studio-extension.courseFromRecording.transcript.notWrittenDown',
    defaultMessage: '{speaker} · {duration} · not written down',
    description: 'A part of the recording that was not transcribed, e.g. the translator.',
  },
  speakerTranslator: {
    id: 'studio-extension.courseFromRecording.transcript.speakerTranslator',
    defaultMessage: 'Translator',
    description: 'Who speaks in a part that was not written down.',
  },
  speakerChanting: {
    id: 'studio-extension.courseFromRecording.transcript.speakerChanting',
    defaultMessage: 'Chanting or prayers',
    description: 'Who speaks in a part that was not written down.',
  },
  speakerOther: {
    id: 'studio-extension.courseFromRecording.transcript.speakerOther',
    defaultMessage: 'Something else',
    description: 'Who speaks in a part that was not written down.',
  },
  speakerSilence: {
    id: 'studio-extension.courseFromRecording.transcript.speakerSilence',
    defaultMessage: 'Silence',
    description: 'A part of the recording where no one speaks.',
  },
  edit: {
    id: 'studio-extension.courseFromRecording.transcript.edit',
    defaultMessage: 'Edit',
    description: 'Button on every line that opens it for editing.',
  },
  editLine: {
    id: 'studio-extension.courseFromRecording.transcript.editLine',
    defaultMessage: 'Edit the line at {time}',
    description: 'Accessible name of a line’s Edit button.',
  },
  lineText: {
    id: 'studio-extension.courseFromRecording.transcript.lineText',
    defaultMessage: 'Text at {time}',
    description: 'Accessible name of the box for correcting a line.',
  },
  save: {
    id: 'studio-extension.courseFromRecording.transcript.save',
    defaultMessage: 'Save',
    description: 'Saves a corrected line.',
  },
  saving: {
    id: 'studio-extension.courseFromRecording.transcript.saving',
    defaultMessage: 'Saving…',
    description: 'Shown on the Save button while a line is saved.',
  },
  cancel: {
    id: 'studio-extension.courseFromRecording.transcript.cancel',
    defaultMessage: 'Cancel',
    description: 'Closes a line without saving the change.',
  },
  corrected: {
    id: 'studio-extension.courseFromRecording.transcript.corrected',
    defaultMessage: 'Corrected by you',
    description: 'Shown under a line the author corrected.',
  },
  undo: {
    id: 'studio-extension.courseFromRecording.transcript.undo',
    defaultMessage: 'Undo',
    description: 'Puts a corrected line back as it was written down.',
  },
  saveError: {
    id: 'studio-extension.courseFromRecording.transcript.saveError',
    defaultMessage: 'The correction could not be saved. Try again in a few minutes.',
    description: 'Error when saving a corrected line failed.',
  },
  emptyError: {
    id: 'studio-extension.courseFromRecording.transcript.emptyError',
    defaultMessage: 'A line can’t be empty. Use Cancel to keep it as it was.',
    description: 'Error when the author tries to save an empty line.',
  },
  nextStep: {
    id: 'studio-extension.courseFromRecording.transcript.nextStep',
    defaultMessage: 'When the text reads well, we suggest a course from it: sections, lessons, summaries and questions. You can change all of it before anything is added to the course. The text can’t be corrected after this.',
    description: 'Explains the next step, above the "Suggest a course" button.',
  },
  suggest: {
    id: 'studio-extension.courseFromRecording.transcript.suggest',
    defaultMessage: 'Suggest a course',
    description: 'Button: the service suggests a course from the checked transcript.',
  },
  suggesting: {
    id: 'studio-extension.courseFromRecording.transcript.suggesting',
    defaultMessage: 'Starting…',
    description: 'Shown on the "Suggest a course" button while the request is sent.',
  },
  suggestError: {
    id: 'studio-extension.courseFromRecording.transcript.suggestError',
    defaultMessage: 'The course could not be suggested just now. Try again in a few minutes.',
    description: 'Error when asking for a course to be suggested failed.',
  },
  noneToCheck: {
    id: 'studio-extension.courseFromRecording.transcript.noneToCheck',
    defaultMessage: 'No lines are marked to check.',
    description: 'Shown when "Only lines to check" is on and there are none.',
  },
});

export default messages;
