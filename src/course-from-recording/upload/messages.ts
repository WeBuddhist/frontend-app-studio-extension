import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  recordingHeading: {
    id: 'studio-extension.courseFromRecording.upload.recordingHeading',
    defaultMessage: 'Recording',
    description: 'Heading above the file picker.',
  },
  dropPrompt: {
    id: 'studio-extension.courseFromRecording.upload.dropPrompt',
    defaultMessage: 'Drop the recording here, or choose a file',
    description: 'Text inside the area where the author drops or picks the audio file.',
  },
  fileRules: {
    id: 'studio-extension.courseFromRecording.upload.fileRules',
    defaultMessage: 'MP3, WAV, M4A, FLAC or OGG, up to {maxSize}',
    description: 'Which audio files can be uploaded.',
  },
  removeFile: {
    id: 'studio-extension.courseFromRecording.upload.removeFile',
    defaultMessage: 'Remove {filename}',
    description: 'Accessible label of the button that removes the chosen file.',
  },
  aboutHeading: {
    id: 'studio-extension.courseFromRecording.upload.aboutHeading',
    defaultMessage: 'About the recording',
    description: 'Heading above the questions about the recording.',
  },
  teacherLabel: {
    id: 'studio-extension.courseFromRecording.upload.teacherLabel',
    defaultMessage: 'Teacher',
    description: 'Label of the teacher name field.',
  },
  speakersLabel: {
    id: 'studio-extension.courseFromRecording.upload.speakersLabel',
    defaultMessage: 'How many people speak?',
    description: 'Question about whether the recording has one speaker or more.',
  },
  oneSpeaker: {
    id: 'studio-extension.courseFromRecording.upload.oneSpeaker',
    defaultMessage: 'Only the teacher',
    description: 'Answer: the recording has one speaker.',
  },
  multipleSpeakers: {
    id: 'studio-extension.courseFromRecording.upload.multipleSpeakers',
    defaultMessage: 'More than one person, for example a teacher and a translator',
    description: 'Answer: the recording has several speakers.',
  },
  multipleSpeakersHelp: {
    id: 'studio-extension.courseFromRecording.upload.multipleSpeakersHelp',
    defaultMessage: 'You will listen to each voice and say which one is the teacher. Only the teacher is transcribed.',
    description: 'Explains what happens with recordings that have several speakers.',
  },
  teacherLanguageLabel: {
    id: 'studio-extension.courseFromRecording.upload.teacherLanguageLabel',
    defaultMessage: 'Language the teacher speaks',
    description: 'Label of the teacher language choice.',
  },
  choose: {
    id: 'studio-extension.courseFromRecording.upload.choose',
    defaultMessage: 'Choose…',
    description: 'Empty first option of a dropdown.',
  },
  languageTibetan: {
    id: 'studio-extension.courseFromRecording.upload.languageTibetan',
    defaultMessage: 'Tibetan',
    description: 'Language option.',
  },
  languageEnglish: {
    id: 'studio-extension.courseFromRecording.upload.languageEnglish',
    defaultMessage: 'English',
    description: 'Language option.',
  },
  languageOther: {
    id: 'studio-extension.courseFromRecording.upload.languageOther',
    defaultMessage: 'Another language',
    description: 'Language option for anything other than Tibetan and English.',
  },
  translatorLanguageLabel: {
    id: 'studio-extension.courseFromRecording.upload.translatorLanguageLabel',
    defaultMessage: 'Language of the translation',
    description: 'Label of the translator language field.',
  },
  translatorLanguagePlaceholder: {
    id: 'studio-extension.courseFromRecording.upload.translatorLanguagePlaceholder',
    defaultMessage: 'Ladakhi',
    description: 'Example value for the translator language field.',
  },
  textLabel: {
    id: 'studio-extension.courseFromRecording.upload.textLabel',
    defaultMessage: 'Text being taught',
    description: 'Label of the field for the text the teaching is about.',
  },
  placeLabel: {
    id: 'studio-extension.courseFromRecording.upload.placeLabel',
    defaultMessage: 'Place',
    description: 'Label of the field for where the teaching was given.',
  },
  yearLabel: {
    id: 'studio-extension.courseFromRecording.upload.yearLabel',
    defaultMessage: 'Year',
    description: 'Label of the field for the year of the teaching.',
  },
  optional: {
    id: 'studio-extension.courseFromRecording.upload.optional',
    defaultMessage: '(optional)',
    description: 'Shown after the label of an optional field.',
  },
  consentLabel: {
    id: 'studio-extension.courseFromRecording.upload.consentLabel',
    defaultMessage: 'I have permission to use this recording to make a course.',
    description: 'Checkbox the author must tick before uploading.',
  },
  backgroundNote: {
    id: 'studio-extension.courseFromRecording.upload.backgroundNote',
    defaultMessage: 'Processing runs in the background and takes a while for long recordings. You can close this page once the upload has finished and come back later.',
    description: 'Explains that processing continues without the page open.',
  },
  cancel: {
    id: 'studio-extension.courseFromRecording.upload.cancel',
    defaultMessage: 'Cancel',
    description: 'Button that goes back to the course outline.',
  },
  submit: {
    id: 'studio-extension.courseFromRecording.upload.submit',
    defaultMessage: 'Upload and start',
    description: 'Button that uploads the recording and starts processing it.',
  },
  uploading: {
    id: 'studio-extension.courseFromRecording.upload.uploading',
    defaultMessage: 'Uploading {filename}',
    description: 'Shown above the upload progress bar.',
  },
  starting: {
    id: 'studio-extension.courseFromRecording.upload.starting',
    defaultMessage: 'Starting…',
    description: 'Shown after the upload, while the job is being queued.',
  },
  keepOpen: {
    id: 'studio-extension.courseFromRecording.upload.keepOpen',
    defaultMessage: 'Keep this page open until the upload finishes.',
    description: 'Shown under the upload progress bar.',
  },
  errorFileMissing: {
    id: 'studio-extension.courseFromRecording.upload.errorFileMissing',
    defaultMessage: 'Choose a recording first.',
    description: 'Error when no file was chosen.',
  },
  errorFileType: {
    id: 'studio-extension.courseFromRecording.upload.errorFileType',
    defaultMessage: 'Choose an MP3, WAV, M4A, FLAC or OGG audio file.',
    description: 'Error when the chosen file is not a supported audio file.',
  },
  errorFileSize: {
    id: 'studio-extension.courseFromRecording.upload.errorFileSize',
    defaultMessage: 'The file is larger than {maxSize}.',
    description: 'Error when the chosen file is too large.',
  },
  errorTeacher: {
    id: 'studio-extension.courseFromRecording.upload.errorTeacher',
    defaultMessage: 'Enter the teacher’s name.',
    description: 'Error when the teacher field is empty.',
  },
  errorSpeakers: {
    id: 'studio-extension.courseFromRecording.upload.errorSpeakers',
    defaultMessage: 'Say how many people speak.',
    description: 'Error when the speakers question is not answered.',
  },
  errorLanguage: {
    id: 'studio-extension.courseFromRecording.upload.errorLanguage',
    defaultMessage: 'Choose the language the teacher speaks.',
    description: 'Error when no teacher language was chosen.',
  },
  errorLanguageUnsupported: {
    id: 'studio-extension.courseFromRecording.upload.errorLanguageUnsupported',
    defaultMessage: 'Only Tibetan and English recordings are supported for now.',
    description: 'Shown when the teacher speaks a language the tool cannot transcribe.',
  },
  errorYear: {
    id: 'studio-extension.courseFromRecording.upload.errorYear',
    defaultMessage: 'Enter a year between 1900 and 2100.',
    description: 'Error when the year is not valid.',
  },
  errorConsent: {
    id: 'studio-extension.courseFromRecording.upload.errorConsent',
    defaultMessage: 'Confirm you have permission to use this recording.',
    description: 'Error when the consent checkbox is not ticked.',
  },
  errorUpload: {
    id: 'studio-extension.courseFromRecording.upload.errorUpload',
    defaultMessage: 'The upload stopped. Check your connection and try again.',
    description: 'Error when sending the file to storage failed.',
  },
  errorGeneric: {
    id: 'studio-extension.courseFromRecording.upload.errorGeneric',
    defaultMessage: 'Something went wrong. Try again in a few minutes.',
    description: 'Error when Studio could not create or start the job.',
  },
  startedOver: {
    id: 'studio-extension.courseFromRecording.upload.startedOver',
    defaultMessage: 'You started over. The details from last time are filled in: correct anything that was wrong, then upload the recording.',
    description: 'Shown above the upload form after starting over with a different recording.',
  },
  startedOverKept: {
    id: 'studio-extension.courseFromRecording.upload.startedOverKept',
    defaultMessage: 'You started over. The details from last time are filled in: correct anything that was wrong, then start again.',
    description: 'Shown above the upload form after starting over with the same recording.',
  },
  alreadyUploaded: {
    id: 'studio-extension.courseFromRecording.upload.alreadyUploaded',
    defaultMessage: 'Already uploaded',
    description: 'Next to a recording kept when starting over: it is not uploaded again.',
  },
  useDifferentRecording: {
    id: 'studio-extension.courseFromRecording.upload.useDifferentRecording',
    defaultMessage: 'Delete it and use a different recording',
    description: 'Deletes the kept recording so another can be uploaded.',
  },
  submitUploaded: {
    id: 'studio-extension.courseFromRecording.upload.submitUploaded',
    defaultMessage: 'Try starting again',
    description: 'Submit button after the recording uploaded but processing could not be started.',
  },
  uploadedNotStarted: {
    id: 'studio-extension.courseFromRecording.upload.uploadedNotStarted',
    defaultMessage: 'Your recording is uploaded; only starting it failed. Try again without uploading it again.',
    description: 'Shown when the upload finished but processing could not be started.',
  },
  submitKept: {
    id: 'studio-extension.courseFromRecording.upload.submitKept',
    defaultMessage: 'Start again',
    description: 'Submit button when the recording is already uploaded.',
  },
});

export default messages;
