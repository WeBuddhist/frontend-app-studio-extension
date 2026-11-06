import type { Job, JobStatus } from './data/api';

/** The tool's steps, in order. Each has its own screen; the step bar at the top shows all of them. */
export type StepKey = 'upload' | 'findSpeakers' | 'tagVoices' | 'clean' | 'transcribe' | 'transcript';
export type StepState = 'done' | 'current' | 'pending';

/** Statuses in which the service is (or will soon be) working, so the page keeps checking. */
export const RUNNING_STATUSES: JobStatus[] = ['queued', 'cleaning', 'finding_speakers', 'transcribing'];

/**
 * The steps of a recording. With more than one speaker the voices are found and tagged first; with
 * one speaker that is skipped and cleaning comes first.
 */
export const stepsFor = (multipleSpeakers: boolean): StepKey[] => (
  multipleSpeakers
    ? ['upload', 'findSpeakers', 'tagVoices', 'clean', 'transcribe', 'transcript']
    : ['upload', 'clean', 'transcribe', 'transcript']
);

/**
 * The step a job is at, or null for a failed job. A queued job waits for its turn at its next step:
 * finding the voices for a new multi-speaker recording, otherwise cleaning (also after the author has
 * tagged the voices and the job went back on the queue).
 */
export const currentStep = (job: Job | null): StepKey | null => {
  if (!job) { return 'upload'; }
  const tagged = Object.keys(job.speakerLabels ?? {}).length > 0;
  const byStatus: Record<JobStatus, StepKey | null> = {
    uploading: 'upload',
    queued: job.details.multipleSpeakers && !tagged ? 'findSpeakers' : 'clean',
    finding_speakers: 'findSpeakers',
    needs_speaker_labels: 'tagVoices',
    cleaning: 'clean',
    transcribing: 'transcribe',
    transcript_ready: 'transcript',
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
