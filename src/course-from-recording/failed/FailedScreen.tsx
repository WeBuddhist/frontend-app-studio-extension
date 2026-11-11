import { useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Alert, Button, Icon } from '@openedx/paragon';
import { Error as ErrorIcon } from '@openedx/paragon/icons';

import { apiErrorMessage, retryJob } from '../data/api';
import type { Job } from '../data/api';
import messages from './messages';

interface FailedScreenProps {
  job: Job;
  /** Called with the queued job after Try again. */
  onRetried: (job: Job) => void;
  /** Called when the author wants to start over with another file. */
  onUploadAnother: () => void;
}

/** Shown when processing stopped: what went wrong, then try again or upload a different recording. */
const FailedScreen = ({ job, onRetried, onUploadAnother }: FailedScreenProps) => {
  const intl = useIntl();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const retry = async () => {
    setRetrying(true);
    setRetryError('');
    try {
      onRetried(await retryJob(job.id));
    } catch (error) {
      setRetryError(apiErrorMessage(error, intl.formatMessage(messages.retryError)));
      setRetrying(false);
    }
  };

  return (
    <section className="recording-failed">
      {retryError && <Alert variant="danger" className="recording-failed__alert">{retryError}</Alert>}
      <div className="recording-failed__header">
        <Icon src={ErrorIcon} className="recording-failed__icon" />
        <h2 className="recording-failed__heading">{intl.formatMessage(messages.heading)}</h2>
      </div>
      <p className="recording-failed__file">
        {intl.formatMessage(messages.recording, { filename: job.originalFilename })}
      </p>
      <p className="recording-failed__reason">
        {job.error
          ? intl.formatMessage(messages.reason, { error: job.error })
          : intl.formatMessage(messages.noReason)}
      </p>
      <p className="recording-failed__help">{intl.formatMessage(messages.retryHelp)}</p>
      <div className="recording-failed__actions">
        <Button variant="tertiary" onClick={onUploadAnother} disabled={retrying}>
          {intl.formatMessage(messages.uploadAnother)}
        </Button>
        <Button variant="primary" onClick={retry} disabled={retrying}>
          {intl.formatMessage(messages.retry)}
        </Button>
      </div>
    </section>
  );
};

export default FailedScreen;
