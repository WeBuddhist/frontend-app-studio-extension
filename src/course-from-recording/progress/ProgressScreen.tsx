import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { Check, Info } from '@openedx/paragon/icons';

import type { Job } from '../data/api';
import { currentStep } from '../steps';
import messages from './messages';

type MessageDescriptor = typeof messages.intro;

interface Phase {
  title: MessageDescriptor;
  stages: MessageDescriptor[];
  /** The step a run starts with: its first part is getting the recording ready. */
  prepares?: boolean;
  /** Where each stage ends, in percent, when the service's progress isn't shared evenly between them. */
  ends?: number[];
}

// The service counts downloading and decoding the recording as the first tenth of a run's first step
// (PREPARE_SHARE in the studio tool service).
const PREPARE_SHARE = 0.1;

/** What the screen shows for the step the service is working on: a title and the parts of that step. */
const phaseFor = (job: Job): Phase | null => {
  switch (currentStep(job)) {
    case 'findSpeakers':
      return {
        title: messages.findSpeakersTitle,
        prepares: true,
        stages: [
          messages.stagePrepare, messages.stageListenVoices, messages.stageGroupVoices, messages.stageVoiceSamples,
        ],
      };
    case 'clean':
      return {
        title: messages.cleanTitle,
        prepares: true,
        stages: [messages.stagePrepare, messages.stageLearnNoise, messages.stageRemoveNoise],
      };
    case 'transcribe':
      return {
        title: messages.transcribeTitle,
        stages: [
          ...(job.details.multipleSpeakers ? [messages.stageTeacherParts] : []),
          messages.stageTranscribe,
          ...(job.details.teacherLanguage === 'bo' ? [messages.stageSpelling] : []),
        ],
      };
    // The service's outline is the first 30 % (one long request, with no progress of its own), the lessons
    // the rest.
    case 'shape':
      return {
        title: messages.suggestTitle,
        stages: [messages.stageTopicBreaks, messages.stageDraftLessons],
        ends: [30, 100],
      };
    // Getting the recordings ready is the first 10 %, cutting up to 95 %, then Studio writes the course.
    case 'course':
      return {
        title: messages.buildTitle,
        stages: [messages.stagePrepare, messages.stageCutAudio, messages.stageWriteCourse],
        ends: [10, 95, 100],
      };
    default:
      return null;
  }
};

interface ProgressScreenProps {
  job: Job;
}

/**
 * While the service works on a step: the step's title, how far it is, and its parts. The service
 * reports one percentage per step, so a part counts as done once the step is far enough through.
 * The page keeps the job up to date; this screen only shows it.
 */
const ProgressScreen = ({ job }: ProgressScreenProps) => {
  const intl = useIntl();
  const phase = phaseFor(job);
  const queued = job.status === 'queued' || !phase;
  const percent = queued ? 0 : Math.min(100, Math.max(0, Math.round(job.progress)));
  // Until the service sends its first percentage (it loads its models first), show movement, not "0%".
  const starting = !queued && percent === 0;
  const title = intl.formatMessage(queued || !phase ? messages.queuedTitle : phase.title);
  const minutes = job.durationSeconds ? Math.max(1, Math.round(job.durationSeconds / 60)) : null;

  // Where each part ends, in percent: getting the recording ready is the first tenth, the rest share
  // what is left evenly.
  const ends = phase?.ends ?? (phase?.stages ?? []).map((_, index, stages) => {
    if (!phase?.prepares) { return ((index + 1) / stages.length) * 100; }
    if (index === 0) { return PREPARE_SHARE * 100; }
    return (PREPARE_SHARE + ((1 - PREPARE_SHARE) * index) / (stages.length - 1)) * 100;
  });

  const stageState = (index: number) => {
    if (queued) { return 'pending'; }
    if (percent >= ends[index]) { return 'done'; }
    return percent >= (index ? ends[index - 1] : 0) ? 'current' : 'pending';
  };

  return (
    <section className={`recording-processing${queued ? ' recording-processing--queued' : ''}`}>
      <div className="recording-processing__header">
        <span className="recording-processing__activity" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
        <div className="recording-processing__heading">
          <h2 className="recording-processing__title">{title}</h2>
          <p className="recording-processing__recording">
            {minutes
              ? intl.formatMessage(messages.recordingWithLength, { filename: job.originalFilename, minutes })
              : job.originalFilename}
          </p>
        </div>
      </div>

      {queued ? (
        <p className="recording-processing__queued">{intl.formatMessage(messages.queuedIntro)}</p>
      ) : (
        <div className="recording-processing__progress">
          <div
            className={`recording-processing__bar${starting ? ' recording-processing__bar--starting' : ''}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={starting ? undefined : percent}
            aria-label={title}
          >
            <div className="recording-processing__bar-fill" style={starting ? undefined : { width: `${percent}%` }} />
          </div>
          <span className="recording-processing__percent">
            {starting ? intl.formatMessage(messages.starting) : intl.formatMessage(messages.percent, { percent })}
          </span>
        </div>
      )}

      {phase && (
        <ul className="recording-processing__stages">
          {phase.stages.map((stage, index) => {
            const state = stageState(index);
            return (
              <li key={stage.id} className={`recording-processing__stage recording-processing__stage--${state}`}>
                <span className="recording-processing__marker" aria-hidden="true">
                  {state === 'done' && <Icon src={Check} className="recording-processing__check" />}
                </span>
                <span className="recording-processing__stage-name">{intl.formatMessage(stage)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="recording-processing__note">
        <Icon src={Info} className="recording-processing__note-icon" />
        {intl.formatMessage(messages.closeTab)}
      </p>
    </section>
  );
};

export default ProgressScreen;
