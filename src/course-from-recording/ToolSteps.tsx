import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { Check } from '@openedx/paragon/icons';

import messages from './messages';
import { stepStates } from './steps';
import type { StepKey } from './steps';

const STEP_NAMES: Record<StepKey, typeof messages.stepUpload> = {
  upload: messages.stepUpload,
  findSpeakers: messages.stepFindSpeakers,
  tagVoices: messages.stepTagVoices,
  clean: messages.stepClean,
  transcribe: messages.stepTranscribe,
  transcript: messages.stepTranscript,
  shape: messages.stepShape,
  course: messages.stepCourse,
};

interface ToolStepsProps {
  steps: StepKey[];
  /** The step on screen now; null when there is none (a failed job). */
  current: StepKey | null;
}

/** The bar of steps at the top of the tool: done ones ticked, the current one highlighted. */
const ToolSteps = ({ steps, current }: ToolStepsProps) => {
  const intl = useIntl();

  return (
    <nav aria-label={intl.formatMessage(messages.stepsLabel)}>
      <ol className="recording-steps">
        {stepStates(steps, current).map(({ step, state }, index) => {
          const name = intl.formatMessage(STEP_NAMES[step]);
          return (
            <li
              key={step}
              className={`recording-steps__step recording-steps__step--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="recording-steps__number" aria-hidden="true">
                {state === 'done' ? <Icon src={Check} className="recording-steps__check" /> : index + 1}
              </span>
              <span className="recording-steps__name">{name}</span>
              {state === 'done' && <span className="sr-only">{intl.formatMessage(messages.stepDone)}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ToolSteps;
