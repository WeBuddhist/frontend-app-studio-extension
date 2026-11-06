import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Button, Form, Icon, IconButton, ProgressBar,
} from '@openedx/paragon';
import { AudioFile, Close, Upload } from '@openedx/paragon/icons';

import {
  apiErrorMessage, createJob, reuseRecording, startJob, startOver, uploadFile,
} from '../data/api';
import type { Job, RecordingDetails, TeacherLanguage } from '../data/api';
import {
  ACCEPTED_EXTENSIONS, checkFile, contentTypeOf, formatLimit, formatSize,
} from '../data/files';
import messages from './messages';

type Speakers = '' | 'one' | 'many';
type LanguageChoice = '' | TeacherLanguage | 'other';
type Field = 'file' | 'teacher' | 'speakers' | 'language' | 'year' | 'consent';
type Phase = 'form' | 'uploading' | 'starting';

interface UploadScreenProps {
  courseId: string;
  /** Studio's upload limit, in MB. */
  maxUploadMb: number;
  /** Called with the queued job once the recording is uploaded and processing has started. */
  onStarted: (job: Job) => void;
  /** Called when the author answers how many people speak, so the step bar can show the right steps. */
  onSpeakersChange?: (multipleSpeakers: boolean) => void;
  /** A job the author started over: the form starts with its details, and its recording if it was kept. */
  previous?: Job | null;
  /** Called with the started-over job once its kept recording is deleted, to use a different one. */
  onPreviousChange?: (job: Job) => void;
}

/**
 * Step 1 of the tool: pick the recording, say who speaks and in which language, then upload it
 * straight to S3 and start processing.
 */
const UploadScreen = ({
  courseId, maxUploadMb, onStarted, onSpeakersChange, previous = null, onPreviousChange,
}: UploadScreenProps) => {
  const intl = useIntl();
  const fileInput = useRef<HTMLInputElement>(null);
  const before = previous?.details;
  // The recording of the started-over job, still in S3: used again without uploading it.
  const keptRecording = previous?.recordingKept ? previous : null;

  const [file, setFile] = useState<File | null>(null);
  const [teacher, setTeacher] = useState(before?.teacher ?? '');
  const speakersBefore: Speakers = before?.multipleSpeakers ? 'many' : 'one';
  const [speakers, setSpeakers] = useState<Speakers>(before ? speakersBefore : '');
  const [language, setLanguage] = useState<LanguageChoice>(before?.teacherLanguage ?? '');
  const [translatorLanguage, setTranslatorLanguage] = useState(before?.translatorLanguage ?? '');
  const [text, setText] = useState(before?.text ?? '');
  const [place, setPlace] = useState(before?.place ?? '');
  const [year, setYear] = useState(before?.year ? String(before.year) : '');
  // Permission was already given for a kept recording.
  const [consent, setConsent] = useState(Boolean(keptRecording));
  const [discarding, setDiscarding] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  // The job whose recording is in S3 but could not be started (e.g. Redis was down): trying again only
  // starts it, instead of uploading the whole recording again. The form stays as it was sent.
  const [uploaded, setUploaded] = useState<Job | null>(null);
  const maxSize = formatLimit(maxUploadMb);

  // The step bar follows the details filled in from last time.
  useEffect(() => {
    if (before) { onSpeakersChange?.(before.multipleSpeakers); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the page mid-upload loses the upload, so the browser asks first.
  useEffect(() => {
    if (phase === 'form') { return undefined; }
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const clearError = (field: Field) => setErrors(({ [field]: _removed, ...rest }) => rest);

  const fileError = (candidate: File): string | undefined => {
    const problem = checkFile(candidate, maxUploadMb);
    if (problem === 'type') { return intl.formatMessage(messages.errorFileType); }
    if (problem === 'size') { return intl.formatMessage(messages.errorFileSize, { maxSize }); }
    return undefined;
  };

  const chooseFile = (candidate: File | undefined) => {
    if (!candidate) { return; }
    const problem = fileError(candidate);
    setFile(problem ? null : candidate);
    setErrors((current) => ({ ...current, file: problem }));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const languageError = (choice: LanguageChoice): string | undefined => {
    if (!choice) { return intl.formatMessage(messages.errorLanguage); }
    if (choice === 'other') { return intl.formatMessage(messages.errorLanguageUnsupported); }
    return undefined;
  };

  const validate = (): boolean => {
    const yearNumber = Number(year);
    // A kept recording needs no file.
    const missingFile = keptRecording ? undefined : intl.formatMessage(messages.errorFileMissing);
    const found: Partial<Record<Field, string>> = {
      file: file ? fileError(file) : missingFile,
      teacher: teacher.trim() ? undefined : intl.formatMessage(messages.errorTeacher),
      speakers: speakers ? undefined : intl.formatMessage(messages.errorSpeakers),
      language: languageError(language),
      year: !year || (Number.isInteger(yearNumber) && yearNumber >= 1900 && yearNumber <= 2100)
        ? undefined : intl.formatMessage(messages.errorYear),
      consent: consent ? undefined : intl.formatMessage(messages.errorConsent),
    };
    const remaining = Object.fromEntries(Object.entries(found).filter(([, message]) => message));
    setErrors(remaining);
    return Object.keys(remaining).length === 0;
  };

  const details = (): RecordingDetails => ({
    teacher: teacher.trim(),
    multipleSpeakers: speakers === 'many',
    teacherLanguage: language as TeacherLanguage,
    translatorLanguage: speakers === 'many' ? translatorLanguage.trim() : undefined,
    text: text.trim() || undefined,
    place: place.trim() || undefined,
    year: year ? Number(year) : undefined,
  });

  // Start again with the kept recording: nothing to upload.
  const startWithKeptRecording = async (kept: Job) => {
    setPhase('starting');
    try {
      onStarted(await reuseRecording(kept.id, details()));
    } catch (error) {
      setSubmitError(apiErrorMessage(error, intl.formatMessage(messages.errorGeneric)));
      setPhase('form');
    }
  };

  // Delete the kept recording, to upload a different one.
  const discardKeptRecording = async (kept: Job) => {
    setDiscarding(true);
    setSubmitError('');
    try {
      onPreviousChange?.(await startOver(kept.id, false));
    } catch (error) {
      setSubmitError(apiErrorMessage(error, intl.formatMessage(messages.errorGeneric)));
    }
    setDiscarding(false);
  };

  const start = async (job: Job) => {
    setPhase('starting');
    try {
      onStarted(await startJob(job.id));
    } catch (error) {
      setUploaded(job);
      setSubmitError(apiErrorMessage(error, intl.formatMessage(messages.errorGeneric)));
      setPhase('form');
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    if (uploaded) {
      await start(uploaded);
      return;
    }
    if (!validate()) { return; }
    if (keptRecording) {
      await startWithKeptRecording(keptRecording);
      return;
    }
    if (!file) { return; }

    setPhase('uploading');
    setProgress(0);
    let created;
    try {
      created = await createJob({
        courseId,
        file,
        contentType: contentTypeOf(file),
        details: details(),
      });
    } catch (error) {
      setSubmitError(apiErrorMessage(error, intl.formatMessage(messages.errorGeneric)));
      setPhase('form');
      return;
    }

    try {
      await uploadFile(created.upload, file, setProgress);
    } catch {
      setSubmitError(intl.formatMessage(messages.errorUpload));
      setPhase('form');
      return;
    }

    await start(created.job);
  };

  const optional = <span className="recording-upload__optional">{intl.formatMessage(messages.optional)}</span>;
  // Nothing can change once the recording is uploaded: the job was created with these details and this file.
  const busy = phase !== 'form' || Boolean(uploaded);

  return (
    <Form className="recording-upload" onSubmit={onSubmit} noValidate>
      {submitError && (
        <Alert variant="danger" className="recording-upload__alert">
          {submitError}
          {uploaded && <p className="mb-0 mt-2">{intl.formatMessage(messages.uploadedNotStarted)}</p>}
        </Alert>
      )}
      {previous && (
        <p className="recording-upload__again" role="status">
          {intl.formatMessage(keptRecording ? messages.startedOverKept : messages.startedOver)}
        </p>
      )}

      <section className="recording-upload__section">
        <h2 className="recording-upload__heading">{intl.formatMessage(messages.recordingHeading)}</h2>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="recording-upload__file-input"
          data-testid="recording-file-input"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            chooseFile(event.target.files?.[0]);
            // eslint-disable-next-line no-param-reassign
            event.target.value = ''; // so choosing the same file again still fires onChange
          }}
          disabled={busy}
        />
        {keptRecording && (
          <div className="recording-upload__file recording-upload__file--kept">
            <Icon src={AudioFile} className="recording-upload__file-icon" />
            <div className="recording-upload__file-text">
              <span className="recording-upload__file-name">{keptRecording.originalFilename}</span>
              <span className="recording-upload__file-size">
                {formatSize(keptRecording.fileSize)}
                <span aria-hidden="true"> · </span>
                {intl.formatMessage(messages.alreadyUploaded)}
              </span>
            </div>
            {!busy && (
              <Button
                variant="link"
                size="sm"
                className="recording-upload__replace"
                disabled={discarding}
                onClick={() => discardKeptRecording(keptRecording)}
              >
                {intl.formatMessage(messages.useDifferentRecording)}
              </Button>
            )}
          </div>
        )}
        {!keptRecording && (file ? (
          <div className="recording-upload__file">
            <Icon src={AudioFile} className="recording-upload__file-icon" />
            <div className="recording-upload__file-text">
              <span className="recording-upload__file-name">{file.name}</span>
              <span className="recording-upload__file-size">{formatSize(file.size)}</span>
            </div>
            {!busy && (
              <IconButton
                src={Close}
                iconAs={Icon}
                alt={intl.formatMessage(messages.removeFile, { filename: file.name })}
                onClick={() => setFile(null)}
              />
            )}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            className={`recording-upload__drop${dragging ? ' recording-upload__drop--active' : ''}${errors.file ? ' recording-upload__drop--invalid' : ''}`}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInput.current?.click();
              }
            }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Icon src={Upload} className="recording-upload__drop-icon" />
            <span className="recording-upload__drop-prompt">{intl.formatMessage(messages.dropPrompt)}</span>
            <span className="recording-upload__drop-rules">
              {intl.formatMessage(messages.fileRules, { maxSize })}
            </span>
          </div>
        ))}
        {errors.file && <p className="recording-upload__error" role="alert">{errors.file}</p>}
      </section>

      <section className="recording-upload__section">
        <h2 className="recording-upload__heading">{intl.formatMessage(messages.aboutHeading)}</h2>

        <Form.Group controlId="recording-teacher" isInvalid={!!errors.teacher}>
          <Form.Label>{intl.formatMessage(messages.teacherLabel)}</Form.Label>
          <Form.Control
            value={teacher}
            disabled={busy}
            onChange={(event: ChangeEvent<HTMLInputElement>) => { setTeacher(event.target.value); clearError('teacher'); }}
          />
          {errors.teacher && <Form.Control.Feedback type="invalid">{errors.teacher}</Form.Control.Feedback>}
        </Form.Group>

        <Form.Group isInvalid={!!errors.speakers}>
          <Form.Label>{intl.formatMessage(messages.speakersLabel)}</Form.Label>
          <Form.RadioSet
            name="recording-speakers"
            value={speakers}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setSpeakers(event.target.value as Speakers);
              onSpeakersChange?.(event.target.value === 'many');
              clearError('speakers');
            }}
          >
            <Form.Radio value="one" disabled={busy}>{intl.formatMessage(messages.oneSpeaker)}</Form.Radio>
            <Form.Radio value="many" disabled={busy}>{intl.formatMessage(messages.multipleSpeakers)}</Form.Radio>
          </Form.RadioSet>
          {speakers === 'many' && (
            <p className="recording-upload__help">{intl.formatMessage(messages.multipleSpeakersHelp)}</p>
          )}
          {errors.speakers && <Form.Control.Feedback type="invalid">{errors.speakers}</Form.Control.Feedback>}
        </Form.Group>

        <div className="recording-upload__grid">
          <Form.Group controlId="recording-language" isInvalid={!!errors.language}>
            <Form.Label>{intl.formatMessage(messages.teacherLanguageLabel)}</Form.Label>
            <Form.Control
              as="select"
              value={language}
              disabled={busy}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const choice = event.target.value as LanguageChoice;
                setLanguage(choice);
                // Say straight away that another language isn't supported, not only on submit.
                setErrors(({ language: _removed, ...rest }) => (
                  choice === 'other' ? { ...rest, language: languageError(choice) } : rest
                ));
              }}
            >
              <option value="">{intl.formatMessage(messages.choose)}</option>
              <option value="bo">{intl.formatMessage(messages.languageTibetan)}</option>
              <option value="en">{intl.formatMessage(messages.languageEnglish)}</option>
              <option value="other">{intl.formatMessage(messages.languageOther)}</option>
            </Form.Control>
            {errors.language && <Form.Control.Feedback type="invalid">{errors.language}</Form.Control.Feedback>}
          </Form.Group>

          {speakers === 'many' && (
            <Form.Group controlId="recording-translator-language">
              <Form.Label>{intl.formatMessage(messages.translatorLanguageLabel)} {optional}</Form.Label>
              <Form.Control
                value={translatorLanguage}
                disabled={busy}
                placeholder={intl.formatMessage(messages.translatorLanguagePlaceholder)}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setTranslatorLanguage(event.target.value)}
              />
            </Form.Group>
          )}

          <Form.Group controlId="recording-text">
            <Form.Label>{intl.formatMessage(messages.textLabel)} {optional}</Form.Label>
            <Form.Control
              value={text}
              disabled={busy}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="recording-place">
            <Form.Label>{intl.formatMessage(messages.placeLabel)} {optional}</Form.Label>
            <Form.Control
              value={place}
              disabled={busy}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPlace(event.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="recording-year" isInvalid={!!errors.year}>
            <Form.Label>{intl.formatMessage(messages.yearLabel)} {optional}</Form.Label>
            <Form.Control
              value={year}
              inputMode="numeric"
              disabled={busy}
              onChange={(event: ChangeEvent<HTMLInputElement>) => { setYear(event.target.value); clearError('year'); }}
            />
            {errors.year && <Form.Control.Feedback type="invalid">{errors.year}</Form.Control.Feedback>}
          </Form.Group>
        </div>
      </section>

      <section className="recording-upload__section recording-upload__section--footer">
        <Form.Group isInvalid={!!errors.consent}>
          <Form.Checkbox
            checked={consent}
            disabled={busy}
            onChange={(event: ChangeEvent<HTMLInputElement>) => { setConsent(event.target.checked); clearError('consent'); }}
          >
            {intl.formatMessage(messages.consentLabel)}
          </Form.Checkbox>
          {errors.consent && <Form.Control.Feedback type="invalid">{errors.consent}</Form.Control.Feedback>}
        </Form.Group>

        <p className="recording-upload__note">{intl.formatMessage(messages.backgroundNote)}</p>

        {phase !== 'form' && keptRecording && (
          <div className="recording-upload__progress" aria-live="polite">
            <span className="recording-upload__progress-label">{intl.formatMessage(messages.starting)}</span>
          </div>
        )}
        {phase !== 'form' && file && !keptRecording && (
          <div className="recording-upload__progress" aria-live="polite">
            <span className="recording-upload__progress-label">
              {phase === 'starting'
                ? intl.formatMessage(messages.starting)
                : intl.formatMessage(messages.uploading, { filename: file.name })}
            </span>
            <ProgressBar now={progress} label={`${progress}%`} />
            <span className="recording-upload__progress-hint">{intl.formatMessage(messages.keepOpen)}</span>
          </div>
        )}
        {(!busy || (uploaded && phase === 'form')) && (
          <div className="recording-upload__actions">
            <Button variant="tertiary" href={`${getConfig().STUDIO_BASE_URL}/course/${courseId}`}>
              {intl.formatMessage(messages.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={discarding}>
              {intl.formatMessage(
                (uploaded && messages.submitUploaded) || (keptRecording && messages.submitKept) || messages.submit,
              )}
            </Button>
          </div>
        )}
      </section>
    </Form>
  );
};

export default UploadScreen;
