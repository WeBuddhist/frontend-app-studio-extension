import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  queuedTitle: {
    id: 'studio-extension.courseFromRecording.progress.queuedTitle',
    defaultMessage: 'Waiting for its turn',
    description: 'Title while the recording waits in the queue.',
  },
  queuedIntro: {
    id: 'studio-extension.courseFromRecording.progress.queuedIntro',
    defaultMessage: 'Recordings are processed one at a time. Yours starts as soon as the one before it has finished.',
    description: 'Explains the queue.',
  },
  findSpeakersTitle: {
    id: 'studio-extension.courseFromRecording.progress.findSpeakersTitle',
    defaultMessage: 'Finding who is speaking',
    description: 'Title while the voices are being found.',
  },
  cleanTitle: {
    id: 'studio-extension.courseFromRecording.progress.cleanTitle',
    defaultMessage: 'Cleaning the audio',
    description: 'Title while background noise is being removed.',
  },
  transcribeTitle: {
    id: 'studio-extension.courseFromRecording.progress.transcribeTitle',
    defaultMessage: 'Writing down the teaching',
    description: 'Title while the teacher is being transcribed.',
  },
  recordingWithLength: {
    id: 'studio-extension.courseFromRecording.progress.recordingWithLength',
    defaultMessage: '{filename} · {minutes} min',
    description: 'The recording being processed and its length.',
  },
  starting: {
    id: 'studio-extension.courseFromRecording.progress.starting',
    defaultMessage: 'Starting…',
    description: 'Shown next to the progress bar before the first progress arrives.',
  },
  percent: {
    id: 'studio-extension.courseFromRecording.progress.percent',
    defaultMessage: '{percent}%',
    description: 'How far the current stage is.',
  },
  closeTab: {
    id: 'studio-extension.courseFromRecording.progress.closeTab',
    defaultMessage: 'This keeps going after you close the tab. Long recordings can take a while; come back any time.',
    description: 'Explains that processing continues without the page open.',
  },
  stagePrepare: {
    id: 'studio-extension.courseFromRecording.progress.stagePrepare',
    defaultMessage: 'Getting the recording ready',
    description: 'First part of a step: downloading and reading the uploaded recording.',
  },
  stageListenVoices: {
    id: 'studio-extension.courseFromRecording.progress.stageListenVoices',
    defaultMessage: 'Listening for different voices',
    description: 'Part of finding who is speaking.',
  },
  stageGroupVoices: {
    id: 'studio-extension.courseFromRecording.progress.stageGroupVoices',
    defaultMessage: 'Grouping the voices',
    description: 'Part of finding who is speaking.',
  },
  stageVoiceSamples: {
    id: 'studio-extension.courseFromRecording.progress.stageVoiceSamples',
    defaultMessage: 'Cutting a short sample of each voice',
    description: 'Part of finding who is speaking.',
  },
  stageLearnNoise: {
    id: 'studio-extension.courseFromRecording.progress.stageLearnNoise',
    defaultMessage: 'Learning the background noise',
    description: 'Part of cleaning the audio.',
  },
  stageRemoveNoise: {
    id: 'studio-extension.courseFromRecording.progress.stageRemoveNoise',
    defaultMessage: 'Removing hum and static',
    description: 'Part of cleaning the audio.',
  },
  stageTeacherParts: {
    id: 'studio-extension.courseFromRecording.progress.stageTeacherParts',
    defaultMessage: 'Picking out the teacher’s parts',
    description: 'Part of transcribing, for recordings with more than one speaker.',
  },
  stageTranscribe: {
    id: 'studio-extension.courseFromRecording.progress.stageTranscribe',
    defaultMessage: 'Transcribing the teaching',
    description: 'Part of transcribing.',
  },
  stageSpelling: {
    id: 'studio-extension.courseFromRecording.progress.stageSpelling',
    defaultMessage: 'Checking Tibetan spellings',
    description: 'Part of transcribing Tibetan recordings.',
  },
});

export default messages;
