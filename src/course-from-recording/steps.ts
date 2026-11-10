import type { Job, JobStatus } from './data/api';

/** The tool's steps, in order. Each has its own screen; the step bar at the top shows all of them. */
export type StepKey =
  | 'upload' | 'findSpeakers' | 'tagVoices' | 'clean' | 'transcribe' | 'transcript' | 'shape' | 'course';
export type StepState = 'done' | 'current' | 'pending';

/** Statuses in which the service is (or will soon be) working, so the page keeps checking. */
export const RUNNING_STATUSES: JobStatus[] = [
  'queued', 'cleaning', 'finding_speakers', 'transcribing', 'suggesting', 'cutting_audio', 'writing_course',
];

/**
 * The steps of a recording. With more than one speaker the voices are found and tagged first; with
 * one speaker that is skipped and cleaning comes first. Then the course: shape it, and it is made.
 */
export const stepsFor = (multipleSpeakers: boolean): StepKey[] => (
  multipleSpeakers
    ? ['upload', 'findSpeakers', 'tagVoices', 'clean', 'transcribe', 'transcript', 'shape', 'course']
    : ['upload', 'clean', 'transcribe', 'transcript', 'shape', 'course']
);

/** The step a queued job waits at: the next one after what is already done. */
const queuedStep = (job: Job): StepKey => {
  if (job.courseApproved) { return 'course'; }
  if (job.downloads?.transcriptJson) { return 'shape'; }
  const tagged = Object.keys(job.speakerLabels ?? {}).length > 0;
  return job.details.multipleSpeakers && !tagged ? 'findSpeakers' : 'clean';
};

/**
 * The step a job is at, or null for a failed job. A queued job waits for its turn at its next step:
 * finding the voices for a new multi-speaker recording, cleaning (also after the author has tagged the
 * voices), shaping the course once there is a transcript, or making the course once it is approved.
 */
export const currentStep = (job: Job | null): StepKey | null => {
  if (!job) { return 'upload'; }
  const byStatus: Record<JobStatus, StepKey | null> = {
    uploading: 'upload',
    queued: queuedStep(job),
    finding_speakers: 'findSpeakers',
    needs_speaker_labels: 'tagVoices',
    cleaning: 'clean',
    transcribing: 'transcribe',
    transcript_ready: 'transcript',
    suggesting: 'shape',
    course_draft_ready: 'shape',
    cutting_audio: 'course',
    writing_course: 'course',
    course_ready: 'course',
    failed: null,
    cancelled: 'upload',
  };
  return byStatus[job.status];
};

/** Done, current or pending for every step. Without a current step (a failed job) only the upload is done. */
export const stepStates = (steps: StepKey[], current: StepKey | null): { step: StepKey; state: StepState }[] => {
  const currentIndex = current === null ? -1 : steps.indexOf(current);
  return steps.map((step, index) => {
    if (currentIndex === -1) { return { step, state: index === 0 ? 'done' : 'pending' }; }
    if (index < currentIndex) { return { step, state: 'done' }; }
    return { step, state: index === currentIndex ? 'current' : 'pending' };
  });
};
