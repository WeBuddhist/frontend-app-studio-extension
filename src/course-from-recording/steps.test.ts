import type { Job } from './data/api';
import {
  currentStep, stepStates, stepsFor,
} from './steps';

const job = (changes: Partial<Job>, multipleSpeakers = false): Job => ({
  status: 'queued',
  speakerLabels: {},
  details: { teacher: 'Geshe Tenzin', multipleSpeakers, teacherLanguage: 'bo' },
  ...changes,
} as Job);

const states = (value: Job) => stepStates(stepsFor(value.details.multipleSpeakers), currentStep(value))
  .map(({ step, state }) => `${step}:${state}`);

it('one speaker: no finding or tagging of voices, cleaning comes first', () => {
  expect(states(job({ status: 'queued' }))).toEqual(
    ['upload:done', 'clean:current', 'transcribe:pending', 'transcript:pending', 'shape:pending', 'course:pending'],
  );
  expect(states(job({ status: 'transcribing' }))).toEqual(
    ['upload:done', 'clean:done', 'transcribe:current', 'transcript:pending', 'shape:pending', 'course:pending'],
  );
});

it('more than one speaker: finds the voices first, then waits for the author to tag them', () => {
  expect(states(job({ status: 'queued' }, true))).toEqual(
    ['upload:done', 'findSpeakers:current', 'tagVoices:pending', 'clean:pending', 'transcribe:pending',
      'transcript:pending', 'shape:pending', 'course:pending'],
  );
  expect(states(job({ status: 'needs_speaker_labels' }, true))).toEqual(
    ['upload:done', 'findSpeakers:done', 'tagVoices:current', 'clean:pending', 'transcribe:pending',
      'transcript:pending', 'shape:pending', 'course:pending'],
  );
});

it('a job queued again after tagging waits at cleaning, not at the start', () => {
  expect(currentStep(job({ status: 'queued', speakerLabels: { 1: 'teacher' } }, true))).toBe('clean');
});

it('after the transcript come shaping the course and making it', () => {
  expect(states(job({ status: 'transcript_ready' }))).toEqual(
    ['upload:done', 'clean:done', 'transcribe:done', 'transcript:current', 'shape:pending', 'course:pending'],
  );
  expect(currentStep(job({ status: 'suggesting' }))).toBe('shape');
  expect(currentStep(job({ status: 'course_draft_ready' }))).toBe('shape');
  expect(currentStep(job({ status: 'cutting_audio' }))).toBe('course');
  expect(currentStep(job({ status: 'writing_course' }))).toBe('course');
  expect(currentStep(job({ status: 'course_ready' }))).toBe('course');
});

it('a job queued for the course waits at its next step', () => {
  const transcribed = { downloads: { transcriptJson: 'https://s3.example/transcript.json' } };
  expect(currentStep(job({ status: 'queued', ...transcribed }))).toBe('shape');
  expect(currentStep(job({ status: 'queued', ...transcribed, courseApproved: true }))).toBe('course');
});

it('a failed job has only its upload done', () => {
  expect(states(job({ status: 'failed' }))).toEqual(
    ['upload:done', 'clean:pending', 'transcribe:pending', 'transcript:pending', 'shape:pending', 'course:pending'],
  );
});

it('before any upload, the upload is the current step', () => {
  expect(stepStates(stepsFor(false), currentStep(null))[0]).toEqual({ step: 'upload', state: 'current' });
});
