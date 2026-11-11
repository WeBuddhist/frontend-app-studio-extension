import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'studio-extension.courseFromRecording.shape.title',
    defaultMessage: 'Shape your course',
    description: 'Title of the screen where the author shapes the suggested course.',
  },
  intro: {
    id: 'studio-extension.courseFromRecording.shape.intro',
    defaultMessage: 'We suggested lessons from natural breaks in the teaching. Rename them, switch off any you don’t want, and check the summaries and questions. Each lesson becomes four pages in the course: Listen, Key points, Check and Reflect.',
    description: 'Explains the Shape your course screen.',
  },
  sectionLabel: {
    id: 'studio-extension.courseFromRecording.shape.sectionLabel',
    defaultMessage: 'Section {number}',
    description: 'Label above a section’s title.',
  },
  include: {
    id: 'studio-extension.courseFromRecording.shape.include',
    defaultMessage: 'Include the lesson “{title}”',
    description: 'Accessible name of the switch that keeps a lesson in the course.',
  },
  lessonTitle: {
    id: 'studio-extension.courseFromRecording.shape.lessonTitle',
    defaultMessage: 'Title of lesson {number}',
    description: 'Accessible name of a lesson’s title box.',
  },
  minutes: {
    id: 'studio-extension.courseFromRecording.shape.minutes',
    defaultMessage: '{minutes} min',
    description: 'How long a lesson’s audio is.',
  },
  edit: {
    id: 'studio-extension.courseFromRecording.shape.edit',
    defaultMessage: 'Edit',
    description: 'Opens a lesson’s summary and questions.',
  },
  close: {
    id: 'studio-extension.courseFromRecording.shape.close',
    defaultMessage: 'Close',
    description: 'Closes a lesson’s summary and questions.',
  },
  editLesson: {
    id: 'studio-extension.courseFromRecording.shape.editLesson',
    defaultMessage: 'Edit the lesson “{title}”',
    description: 'Accessible name of a lesson’s Edit button.',
  },
  summary: {
    id: 'studio-extension.courseFromRecording.shape.summary',
    defaultMessage: 'Summary',
    description: 'Label of a lesson’s summary.',
  },
  keyPoints: {
    id: 'studio-extension.courseFromRecording.shape.keyPoints',
    defaultMessage: 'Key points',
    description: 'Heading of a lesson’s key points.',
  },
  keyPoint: {
    id: 'studio-extension.courseFromRecording.shape.keyPoint',
    defaultMessage: 'Key point {number}',
    description: 'Accessible name of a key point’s box.',
  },
  addKeyPoint: {
    id: 'studio-extension.courseFromRecording.shape.addKeyPoint',
    defaultMessage: 'Add a key point',
    description: 'Adds an empty key point to a lesson.',
  },
  questions: {
    id: 'studio-extension.courseFromRecording.shape.questions',
    defaultMessage: 'Practice questions',
    description: 'Heading of a lesson’s multiple-choice questions (not graded).',
  },
  question: {
    id: 'studio-extension.courseFromRecording.shape.question',
    defaultMessage: 'Question {number}',
    description: 'Accessible name of a question’s text box.',
  },
  option: {
    id: 'studio-extension.courseFromRecording.shape.option',
    defaultMessage: 'Question {question}, option {number}',
    description: 'Accessible name of an option’s text box.',
  },
  rightAnswer: {
    id: 'studio-extension.courseFromRecording.shape.rightAnswer',
    defaultMessage: 'Option {number} is the right answer',
    description: 'Accessible name of the button that marks an option as the right answer.',
  },
  explanation: {
    id: 'studio-extension.courseFromRecording.shape.explanation',
    defaultMessage: 'Why it’s right (question {number})',
    description: 'Accessible name of the box for why the right answer is right.',
  },
  explanationPlaceholder: {
    id: 'studio-extension.courseFromRecording.shape.explanationPlaceholder',
    defaultMessage: 'Why it’s right (optional)',
    description: 'Placeholder of the box for why the right answer is right.',
  },
  removeQuestion: {
    id: 'studio-extension.courseFromRecording.shape.removeQuestion',
    defaultMessage: 'Remove question {number}',
    description: 'Removes a question from a lesson.',
  },
  reflection: {
    id: 'studio-extension.courseFromRecording.shape.reflection',
    defaultMessage: 'Reflection questions',
    description: 'Heading of a lesson’s open questions to reflect on.',
  },
  reflectionQuestion: {
    id: 'studio-extension.courseFromRecording.shape.reflectionQuestion',
    defaultMessage: 'Reflection question {number}',
    description: 'Accessible name of a reflection question’s box.',
  },
  addReflection: {
    id: 'studio-extension.courseFromRecording.shape.addReflection',
    defaultMessage: 'Add a reflection question',
    description: 'Adds an empty reflection question to a lesson.',
  },
  remove: {
    id: 'studio-extension.courseFromRecording.shape.remove',
    defaultMessage: 'Remove {item}',
    description: 'Accessible name of the button that removes a key point or reflection question.',
  },
  count: {
    id: 'studio-extension.courseFromRecording.shape.count',
    defaultMessage: '{lessons, plural, one {# lesson} other {# lessons}} · {minutes} min of audio',
    description: 'How many lessons are kept and how much audio they have.',
  },
  saving: {
    id: 'studio-extension.courseFromRecording.shape.saving',
    defaultMessage: 'Saving…',
    description: 'Shown while the author’s changes are saved.',
  },
  saved: {
    id: 'studio-extension.courseFromRecording.shape.saved',
    defaultMessage: 'All changes saved',
    description: 'Shown once the author’s changes are saved.',
  },
  saveError: {
    id: 'studio-extension.courseFromRecording.shape.saveError',
    defaultMessage: 'Your latest changes could not be saved yet. They are kept here, and we’ll try again in a few seconds.',
    description: 'Error when saving the author’s changes failed.',
  },
  problemSectionTitle: {
    id: 'studio-extension.courseFromRecording.shape.problemSectionTitle',
    defaultMessage: 'Every section needs a title.',
    description: 'Why changes can’t be saved yet.',
  },
  problemLessonTitle: {
    id: 'studio-extension.courseFromRecording.shape.problemLessonTitle',
    defaultMessage: 'Every lesson needs a title.',
    description: 'Why changes can’t be saved yet.',
  },
  problemQuestion: {
    id: 'studio-extension.courseFromRecording.shape.problemQuestion',
    defaultMessage: 'Every question needs its text, and options that are all different.',
    description: 'Why changes can’t be saved yet.',
  },
  approved: {
    id: 'studio-extension.courseFromRecording.shape.approved',
    defaultMessage: 'The teacher or their office has reviewed this outline.',
    description: 'Checkbox the author must tick before the course is made.',
  },
  keepOne: {
    id: 'studio-extension.courseFromRecording.shape.keepOne',
    defaultMessage: 'Keep at least one lesson.',
    description: 'Error when every lesson is switched off.',
  },
  approveFirst: {
    id: 'studio-extension.courseFromRecording.shape.approveFirst',
    defaultMessage: 'Confirm the teacher or their office has reviewed the outline first.',
    description: 'Error when the review checkbox isn’t ticked.',
  },
  create: {
    id: 'studio-extension.courseFromRecording.shape.create',
    defaultMessage: 'Create draft course',
    description: 'Button: cut the lesson audio and add the course to Studio as a draft.',
  },
  creating: {
    id: 'studio-extension.courseFromRecording.shape.creating',
    defaultMessage: 'Starting…',
    description: 'Shown on the Create draft course button while the request is sent.',
  },
  createError: {
    id: 'studio-extension.courseFromRecording.shape.createError',
    defaultMessage: 'The course could not be started just now. Try again in a few minutes.',
    description: 'Error when asking for the course to be made failed.',
  },
});

export default messages;
