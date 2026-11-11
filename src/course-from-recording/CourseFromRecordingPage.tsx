import { useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Button, Container, Spinner,
} from '@openedx/paragon';
import { RestartAlt } from '@openedx/paragon/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { apiErrorMessage, getLatestJob } from './data/api';
import type { Job, LatestJob } from './data/api';
import FailedScreen from './failed/FailedScreen';
import messages from './messages';
import ProgressScreen from './progress/ProgressScreen';
import StartOverScreen from './start-over/StartOverScreen';
import type { RecordingChoice } from './start-over/StartOverScreen';
import startOverMessages from './start-over/messages';
import CourseReadyScreen from './course-ready/CourseReadyScreen';
import ShapeCourseScreen from './shape-course/ShapeCourseScreen';
import { RUNNING_STATUSES, currentStep, stepsFor } from './steps';
import TagVoicesScreen from './tag-voices/TagVoicesScreen';
import TranscriptScreen from './transcript/TranscriptScreen';
import ToolSteps from './ToolSteps';
import UploadScreen from './upload/UploadScreen';

const POLL_MILLISECONDS = 5000;

/**
 * The course-from-recording tool: turns a teaching recording into this course's outline.
 * One route for the whole tool. The step bar at the top shows every step; below it, each step has its
 * own screen, and the page opens the one the course's latest job has reached.
 */
const CourseFromRecordingPage = () => {
  const intl = useIntl();
  const { courseId = '' } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const jobKey = ['course-from-recording', 'latest-job', courseId];
  const latestJob = useQuery({
    queryKey: jobKey,
    queryFn: () => getLatestJob(courseId),
    // Ask Studio again every few seconds while the service is working, and stop once it no longer is.
    refetchInterval: (query) => (
      query.state.data?.job && RUNNING_STATUSES.includes(query.state.data.job.status) ? POLL_MILLISECONDS : false
    ),
  });
  // The start over confirmation is open, with this recording choice selected first.
  const [confirmStartOver, setConfirmStartOver] = useState<RecordingChoice | null>(null);
  // On the upload screen, the step bar follows the author's answer to "How many people speak?".
  const [uploadMultipleSpeakers, setUploadMultipleSpeakers] = useState(false);
  // A screen's answer from Studio is the newest state of the job. A refetch still under way (e.g. after the
  // window got focus) started earlier, so it is dropped rather than allowed to land after this and undo it.
  const updateLatest = (update: (latest: LatestJob | undefined) => LatestJob | undefined) => {
    queryClient.cancelQueries({ queryKey: jobKey });
    queryClient.setQueryData<LatestJob>(jobKey, update);
  };
  const showJob = (job: Job) => {
    setConfirmStartOver(null);
    updateLatest((latest) => latest && { ...latest, job });
  };

  const job = latestJob.data?.job ?? null;
  // No job yet, an upload that never finished (its page was closed), or a job the author started over.
  const uploading = !job || job.status === 'uploading' || job.status === 'cancelled';

  let content;
  if (latestJob.isPending) {
    content = <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />;
  } else if (latestJob.isError) {
    content = (
      <Alert variant="danger">
        {apiErrorMessage(latestJob.error, intl.formatMessage(messages.loadError))}
      </Alert>
    );
  } else if (uploading || !job) {
    const previous = job?.status === 'cancelled' ? job : null;
    content = (
      <UploadScreen
        // A new form when the job changes, e.g. once the kept recording is deleted.
        key={previous ? `${previous.id}-${previous.recordingKept}` : 'new'}
        courseId={courseId}
        maxUploadMb={latestJob.data.maxUploadMb}
        previous={previous}
        onStarted={showJob}
        onPreviousChange={showJob}
        onSpeakersChange={setUploadMultipleSpeakers}
      />
    );
  } else if (confirmStartOver) {
    content = (
      <StartOverScreen
        job={job}
        initialChoice={confirmStartOver}
        onCancel={() => setConfirmStartOver(null)}
        onStartedOver={showJob}
      />
    );
  } else if (job.status === 'failed') {
    content = <FailedScreen job={job} onRetried={showJob} onUploadAnother={() => setConfirmStartOver('different')} />;
  } else if (RUNNING_STATUSES.includes(job.status)) {
    content = <ProgressScreen job={job} />;
  } else if (job.status === 'needs_speaker_labels') {
    content = <TagVoicesScreen job={job} onTagged={showJob} onSamplesExpired={() => latestJob.refetch()} />;
  } else if (job.status === 'transcript_ready') {
    content = <TranscriptScreen job={job} onLinksExpired={() => latestJob.refetch()} onSuggested={showJob} />;
  } else if (job.status === 'course_draft_ready') {
    content = (
      <ShapeCourseScreen
        key={job.id}
        job={job}
        onBuilt={showJob}
        // Only into the same job: by the time the screen closes, the page may hold a newer one.
        onDraftChange={(courseDraft) => updateLatest((latest) => (
          latest?.job?.id === job.id ? { ...latest, job: { ...latest.job, courseDraft } } : latest
        ))}
      />
    );
  } else if (job.status === 'course_ready') {
    content = <CourseReadyScreen job={job} courseId={courseId} />;
  } else {
    content = (
      <p className="course-from-recording__placeholder">
        {intl.formatMessage(messages.jobStatus, { status: job.statusLabel })}
      </p>
    );
  }

  const loaded = !latestJob.isPending && !latestJob.isError;

  return (
    <Container size="lg" className="course-from-recording">
      <h1 className="course-from-recording__title">{intl.formatMessage(messages.title)}</h1>
      <div className="course-from-recording__meta">
        <p className="course-from-recording__course">
          {intl.formatMessage(messages.courseLabel, { courseId })}
        </p>
        {/* On every step after the upload: delete what was made so far and begin again. */}
        {loaded && !uploading && !confirmStartOver && (
          <Button
            variant="link"
            size="sm"
            iconBefore={RestartAlt}
            className="course-from-recording__start-over"
            onClick={() => setConfirmStartOver('keep')}
          >
            {intl.formatMessage(startOverMessages.startOver)}
          </Button>
        )}
      </div>
      {loaded && (
        <ToolSteps
          steps={stepsFor(uploading || !job ? uploadMultipleSpeakers : job.details.multipleSpeakers)}
          current={uploading ? 'upload' : currentStep(job)}
        />
      )}
      {content}
    </Container>
  );
};

export default CourseFromRecordingPage;
