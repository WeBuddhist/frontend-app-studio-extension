import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'studio-extension.courseFromRecording.ready.title',
    defaultMessage: 'Your draft course is ready',
    description: 'Title once the course has been added to Studio.',
  },
  intro: {
    id: 'studio-extension.courseFromRecording.ready.intro',
    defaultMessage: 'The lessons are in the course outline. Nothing is published yet, so learners can’t see them until you publish them there.',
    description: 'Explains that the course is an unpublished draft.',
  },
  sections: {
    id: 'studio-extension.courseFromRecording.ready.sections',
    defaultMessage: 'Sections',
    description: 'Label of the number of sections added.',
  },
  lessons: {
    id: 'studio-extension.courseFromRecording.ready.lessons',
    defaultMessage: 'Lessons',
    description: 'Label of the number of lessons added.',
  },
  audio: {
    id: 'studio-extension.courseFromRecording.ready.audio',
    defaultMessage: 'Audio',
    description: 'Label of how much lesson audio was added.',
  },
  audioMinutes: {
    id: 'studio-extension.courseFromRecording.ready.audioMinutes',
    defaultMessage: '{minutes} min',
    description: 'How much lesson audio was added.',
  },
  outlineHeading: {
    id: 'studio-extension.courseFromRecording.ready.outlineHeading',
    defaultMessage: 'Added to the course outline',
    description: 'Heading above the list of sections and lessons added.',
  },
  sectionTitle: {
    id: 'studio-extension.courseFromRecording.ready.sectionTitle',
    defaultMessage: 'Section {number}: {title}',
    description: 'A section added to the course.',
  },
  lessonMeta: {
    id: 'studio-extension.courseFromRecording.ready.lessonMeta',
    defaultMessage: 'Audio lesson · {minutes} min',
    description: 'What a lesson added to the course is, and how long.',
  },
  draft: {
    id: 'studio-extension.courseFromRecording.ready.draft',
    defaultMessage: 'Draft',
    description: 'Badge: the lesson is not published.',
  },
  editThere: {
    id: 'studio-extension.courseFromRecording.ready.editThere',
    defaultMessage: 'To change a lesson, open it in the course outline. “Edit with SherabAI” works on these sections too.',
    description: 'Where to keep editing the course.',
  },
  openOutline: {
    id: 'studio-extension.courseFromRecording.ready.openOutline',
    defaultMessage: 'Open in course outline',
    description: 'Button: go to the course outline in Studio.',
  },
});

export default messages;
