import { useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Alert, Button, Icon } from '@openedx/paragon';
import {
  AudioFile, CheckCircle, DeleteOutline, Info, RestartAlt, Upload, WarningFilled,
} from '@openedx/paragon/icons';

import { apiErrorMessage, startOver } from '../data/api';
import type { Job } from '../data/api';
import { RUNNING_STATUSES } from '../steps';
import messages from './messages';

export type RecordingChoice = 'keep' | 'different';

const CHOICES = [
  {
    value: 'keep', icon: AudioFile, label: messages.keepRecording, help: messages.keepRecordingHelp,
  },
  {
    value: 'different', icon: Upload, label: messages.differentRecording, help: messages.differentRecordingHelp,
  },
] as const;

interface StartOverScreenProps {
  job: Job;
  /** The choice selected at first: "different" when the author came from "Upload a different recording". */
  initialChoice: RecordingChoice;
  onCancel: () => void;
  /** Called with the started-over job once its files are deleted. */
  onStartedOver: (job: Job) => void;
}

/**
 * Confirms starting over: says what is deleted (and what was already paid for), and lets the author keep
 * the recording, to start again without uploading it, or delete it too, to use a different one.
 */
const StartOverScreen = ({
  job, initialChoice, onCancel, onStartedOver,
}: StartOverScreenProps) => {
  const intl = useIntl();
  const [choice, setChoice] = useState<RecordingChoice>(initialChoice);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const downloads = job.downloads ?? {};
  const deleted = [
    RUNNING_STATUSES.includes(job.status) && messages.stopsProcessing,
    (job.speakerGroups?.length || downloads.timeline) && messages.voices,
    downloads.clean && messages.cleanAudio,
    downloads.transcript && messages.transcript,
    job.courseDraft?.sections && messages.courseDraft,
  ].filter(Boolean) as (typeof messages.voices)[];
  if (!deleted.length) { deleted.push(messages.progressSoFar); }
  if (choice === 'different') { deleted.push(messages.recording); }

  const paidMinutes = job.transcribedMinutes > 0 ? Math.max(1, Math.round(job.transcribedMinutes)) : 0;

  const confirm = async () => {
    setDeleting(true);
    setError('');
    try {
      onStartedOver(await startOver(job.id, choice === 'keep'));
    } catch (startOverError) {
      setError(apiErrorMessage(startOverError, intl.formatMessage(messages.error)));
      setDeleting(false);
    }
  };

  return (
    <section className="recording-start-over" aria-labelledby="recording-start-over-title">
      <div className="recording-start-over__header">
        <span className="recording-start-over__icon"><Icon src={RestartAlt} /></span>
        <div>
          <h2 id="recording-start-over-title" className="recording-start-over__title">
            {intl.formatMessage(messages.title)}
          </h2>
          <p className="recording-start-over__file">{job.originalFilename}</p>
        </div>
      </div>

      <div className="recording-start-over__deleted">
        <p className="recording-start-over__deleted-heading">{intl.formatMessage(messages.deletedHeading)}</p>
        <ul className="recording-start-over__deleted-list">
          {deleted.map((message) => (
            <li key={message.id}>
              <Icon src={DeleteOutline} className="recording-start-over__deleted-icon" />
              {intl.formatMessage(message)}
            </li>
          ))}
        </ul>
      </div>

      {job.courseSections?.length > 0 && (
        <p className="recording-start-over__paid" role="note">
          <Icon src={Info} className="recording-start-over__paid-icon" />
          {intl.formatMessage(messages.courseStays)}
        </p>
      )}

      {paidMinutes > 0 && (
        <p className="recording-start-over__paid" role="note">
          <Icon src={WarningFilled} className="recording-start-over__paid-icon" />
          {intl.formatMessage(messages.paidMinutes, { minutes: paidMinutes })}
        </p>
      )}

      {/* Two cards; each is a radio button, so the keyboard and screen readers work as usual. */}
      <fieldset className="recording-start-over__choice" disabled={deleting}>
        <legend className="recording-start-over__choice-label">{intl.formatMessage(messages.choiceLabel)}</legend>
        <div className="recording-start-over__cards">
          {CHOICES.map(({
            value, icon, label, help,
          }) => {
            const id = `recording-start-over-${value}`;
            const selected = choice === value;
            return (
              <label
                key={value}
                htmlFor={id}
                className={`recording-start-over__card${selected ? ' recording-start-over__card--selected' : ''}`}
              >
                <input
                  id={id}
                  type="radio"
                  name="recording-start-over-choice"
                  value={value}
                  checked={selected}
                  onChange={() => setChoice(value)}
                  aria-labelledby={`${id}-label`}
                  aria-describedby={`${id}-help`}
                  className="recording-start-over__card-input sr-only"
                />
                <span className="recording-start-over__card-icon"><Icon src={icon} /></span>
                <span className="recording-start-over__card-text">
                  <span id={`${id}-label`} className="recording-start-over__card-title">
                    {intl.formatMessage(label)}
                  </span>
                  <span id={`${id}-help`} className="recording-start-over__card-help">
                    {intl.formatMessage(help)}
                  </span>
                </span>
                <Icon src={CheckCircle} className="recording-start-over__card-check" />
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <Alert variant="danger" className="recording-start-over__alert">{error}</Alert>}

      <div className="recording-start-over__actions">
        <Button variant="tertiary" className="recording-start-over__cancel" onClick={onCancel} disabled={deleting}>
          {intl.formatMessage(messages.cancel)}
        </Button>
        <Button variant="danger" className="recording-start-over__confirm" onClick={confirm} disabled={deleting}>
          {intl.formatMessage(deleting ? messages.deleting : messages.confirm)}
        </Button>
      </div>
    </section>
  );
};

export default StartOverScreen;
