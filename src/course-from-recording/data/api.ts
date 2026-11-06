import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

// The sherab-custom-plugin course_from_recording app, on the Studio host.
const getApiBaseUrl = () => `${getConfig().STUDIO_BASE_URL}/api/course-from-recording/v1`;

export type JobStatus =
  | 'uploading'
  | 'queued'
  | 'cleaning'
  | 'finding_speakers'
  | 'needs_speaker_labels'
  | 'transcribing'
  | 'transcript_ready'
  | 'failed'
  | 'cancelled';

export type TeacherLanguage = 'bo' | 'en';

export interface RecordingDetails {
  teacher: string;
  multipleSpeakers: boolean;
  teacherLanguage: TeacherLanguage;
  translatorLanguage?: string;
  text?: string;
  place?: string;
  year?: number;
}

export interface SpeakerGroup {
  group: string;
  minutes: number;
  samples: string[];
}

export interface Job {
  id: string;
  courseId: string;
  status: JobStatus;
  statusLabel: string;
  progress: number;
  error: string;
  details: RecordingDetails;
  originalFilename: string;
  fileSize: number;
  durationSeconds: number | null;
  downloads: Record<string, string>;
  speakerGroups: SpeakerGroup[];
  speakerLabels: Record<string, string>;
  /** Minutes already sent for transcription (and paid for). */
  transcribedMinutes: number;
  /** A job the author started over: its recording is still there, to start again without uploading it. */
  recordingKept: boolean;
  /** The author's corrections of the transcript: line number -> text. */
  transcriptEdits: Record<string, string>;
  created: string;
  modified: string;
}

export interface UploadTarget {
  method: string;
  url: string;
  headers: Record<string, string>;
}

export interface NewJob {
  courseId: string;
  file: File;
  contentType: string;
  details: RecordingDetails;
}

export interface LatestJob {
  /** The course's latest job, or null if it has none yet. */
  job: Job | null;
  /** The largest recording Studio accepts (its COURSE_FROM_RECORDING_MAX_UPLOAD_MB setting). */
  maxUploadMb: number;
}

/** The course's latest job, and Studio's upload limit. */
export async function getLatestJob(courseId: string): Promise<LatestJob> {
  const { data } = await getAuthenticatedHttpClient().get(`${getApiBaseUrl()}/jobs/`, {
    params: { course_id: courseId },
  });
  return { job: data.job ? camelCaseObject(data.job) : null, maxUploadMb: data.max_upload_mb };
}

const detailsPayload = (details: RecordingDetails) => ({
  teacher: details.teacher,
  multiple_speakers: details.multipleSpeakers,
  teacher_language: details.teacherLanguage,
  translator_language: details.translatorLanguage,
  text: details.text,
  place: details.place,
  year: details.year,
});

/** Create the job; the answer includes a signed link to upload the recording straight to S3. */
export async function createJob({
  courseId, file, contentType, details,
}: NewJob): Promise<{ job: Job; upload: UploadTarget }> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/`, {
    course_id: courseId,
    filename: file.name,
    content_type: contentType,
    size: file.size,
    consent: true,
    details: detailsPayload(details),
  });
  // The upload headers must be sent exactly as signed, so they are not camel-cased.
  return { job: camelCaseObject(data.job), upload: data.upload };
}

/**
 * PUT the file to S3 with a plain request: S3 needs no Open edX login (the link is signed), and an
 * XMLHttpRequest, unlike fetch, reports upload progress. ``onProgress`` gets 0-100.
 */
export function uploadFile(
  target: UploadTarget,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(target.method, target.url);
    Object.entries(target.headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => (
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${request.status}`))
    );
    request.onerror = () => reject(new Error('Upload failed'));
    // E.g. the computer slept, or a proxy cut the connection: without these the upload would wait forever.
    request.onabort = () => reject(new Error('Upload stopped'));
    request.ontimeout = () => reject(new Error('Upload timed out'));
    request.send(file);
  });
}

/** Tell Studio the upload is done; it checks the file is in S3 and queues the job. */
export async function startJob(jobId: string): Promise<Job> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/start/`);
  return camelCaseObject(data.job);
}

export type SpeakerLabel = 'teacher' | 'translator' | 'chanting' | 'other';

/** Save the author's tag for every voice; Studio puts the job back on the queue. */
export async function tagVoices(jobId: string, labels: Record<string, SpeakerLabel>): Promise<Job> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/speakers/`, { labels });
  return camelCaseObject(data.job);
}

/** Queue a failed job again; the service continues from the step that failed. */
export async function retryJob(jobId: string): Promise<Job> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/retry/`);
  return camelCaseObject(data.job);
}

/**
 * Save the author's correction of one transcript line, or with ``text: null`` undo it.
 * Returns all of the job's corrections.
 */
export async function saveTranscriptEdit(
  jobId: string,
  line: number,
  text: string | null,
): Promise<Record<string, string>> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/transcript-edits/`, {
    line, text,
  });
  return data.transcript_edits;
}

/**
 * Stop the job and delete everything made from the recording so far. With ``keepRecording`` the
 * recording itself stays, to start again without uploading it; otherwise it is deleted too.
 */
export async function startOver(jobId: string, keepRecording: boolean): Promise<Job> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/start-over/`, {
    keep_recording: keepRecording,
  });
  return camelCaseObject(data.job);
}

/** Start a new job with the recording a started-over job kept; it is queued straight away. */
export async function reuseRecording(jobId: string, details: RecordingDetails): Promise<Job> {
  const { data } = await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}/jobs/${jobId}/reuse-recording/`, {
    consent: true,
    details: detailsPayload(details),
  });
  return camelCaseObject(data.job);
}

/**
 * The message to show for a failed API call: Studio's own ``error``, or the first field error
 * (e.g. ``{"details": {"teacher_language": ["..."]}}``), or ``fallback``. Only a JSON answer counts:
 * a text one is an error page (e.g. a proxy's "502 Bad Gateway" HTML), not a message for the author.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') { return fallback; }
  const first = (value: unknown): string | undefined => {
    if (typeof value === 'string') { return value; }
    if (Array.isArray(value)) { return first(value[0]); }
    if (value && typeof value === 'object') { return first(Object.values(value)[0]); }
    return undefined;
  };
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return first(data) ?? fallback;
}
