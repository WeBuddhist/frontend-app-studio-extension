import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Button, Form, Icon, Spinner,
} from '@openedx/paragon';
import { Edit, Pause, PlayArrow } from '@openedx/paragon/icons';

import { apiErrorMessage, saveTranscriptEdit, suggestCourse } from '../data/api';
import type { Job } from '../data/api';
import { clock } from '../data/format';
import useServiceFile from '../data/useServiceFile';
import messages from './messages';

/** One line of the service's 3-transcript/transcript.json. ``text`` is null for a part not written down. */
interface Line {
  start: number;
  end: number;
  speaker: string;
  text: string | null;
  warnings: string[];
}

type Message = typeof messages.checkMissing;

// The service's reasons for marking a line (pieces.warnings_for), in words for the author.
const CHECK_REASONS: [string, Message][] = [
  ['empty result', messages.checkEmpty],
  ['too little text', messages.checkMissing],
  ['too much text', messages.checkInvented],
  ['a phrase repeats', messages.checkRepeats],
  ['cut without a pause', messages.checkSplitWord],
];

const SPEAKERS: Record<string, Message> = {
  translator: messages.speakerTranslator,
  chanting: messages.speakerChanting,
  other: messages.speakerOther,
  'no speech': messages.speakerSilence,
};

const marked = (line: Line) => line.text !== null && line.warnings.length > 0;

/** The line being heard at ``seconds``. Lines can overlap by a few seconds, so it is the one that started last. */
const lineAt = (lines: Line[], seconds: number) => lines.reduce(
  (found, line, index) => (seconds >= line.start && seconds < line.end ? index : found),
  -1,
);

interface TranscriptScreenProps {
  job: Job;
  /** The download links expire after an hour; called to fetch fresh ones when the audio won't play. */
  onLinksExpired: () => void;
  /** Called with the queued job once the author asks for a course to be suggested. */
  onSuggested: (job: Job) => void;
}

/**
 * The transcript, to read through and correct: each line with its time (which plays the cleaned
 * recording from there), the lines the computer was unsure about marked, and the parts that were not
 * written down (the translator, silences) as short grey rows. Corrections are saved to Studio line by line.
 */
const TranscriptScreen = ({ job, onLinksExpired, onSuggested }: TranscriptScreenProps) => {
  const intl = useIntl();
  const player = useRef<HTMLAudioElement>(null);
  const transcript = useServiceFile<Line[]>(job.id, 'transcript', job.downloads?.transcriptJson);

  const [edits, setEdits] = useState<Record<string, string>>(job.transcriptEdits ?? {});
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [onlyToCheck, setOnlyToCheck] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  // The line being heard: highlighted, and its play button shows pause. Kept as the line, not the time,
  // so the transcript is drawn again only when the next line starts, not on every tick of the player.
  const [heard, setHeard] = useState(-1);
  const [paused, setPaused] = useState(true);
  // Where the author asked to listen from, until it plays. The audio link expires after an hour; if
  // it has, the page fetches a fresh one and playing goes on from here (once: a second failure is not
  // an expired link).
  const wanted = useRef<number | null>(null);
  const refreshed = useRef(false);

  const lines = transcript.data ?? [];
  const textOf = (index: number) => edits[index] ?? lines[index].text;
  const written = lines.filter((line) => line.text !== null);
  // Marked by the service and not corrected since.
  const toCheck = (line: Line, index: number) => marked(line) && edits[index] === undefined;

  const playFrom = (seconds: number) => {
    const audio = player.current;
    if (!audio) { return; }
    wanted.current = seconds;
    audio.currentTime = seconds;
    audio.play().catch(() => {});
  };

  const clean = job.downloads?.clean;
  useEffect(() => {
    if (wanted.current !== null && refreshed.current) { playFrom(wanted.current); }
  }, [clean]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAudioError = () => {
    if (refreshed.current) {
      wanted.current = null;
      return;
    }
    wanted.current = wanted.current ?? player.current?.currentTime ?? null;
    refreshed.current = true;
    onLinksExpired();
  };

  // ▶ and the time at the start of every row: plays the recording from that line, or pauses it while
  // that line is being heard.
  const playButton = (line: Line, index: number) => {
    const time = clock(line.start);
    const active = index === heard && !paused;
    return (
      <button
        type="button"
        className={`recording-transcript__time${active ? ' recording-transcript__time--active' : ''}`}
        aria-label={intl.formatMessage(active ? messages.pause : messages.playFrom, { time })}
        aria-pressed={active}
        onClick={() => (active ? player.current?.pause() : playFrom(line.start))}
      >
        <Icon src={active ? Pause : PlayArrow} className="recording-transcript__time-icon" />
        {time}
      </button>
    );
  };

  const open = (index: number) => {
    setEditing(index);
    setDraft(textOf(index) ?? '');
    setError('');
  };

  const save = async (index: number, text: string | null) => {
    if (text !== null && !text.trim()) {
      setError(intl.formatMessage(messages.emptyError));
      return;
    }
    // Saving the line exactly as written down is the same as no correction.
    const value = text !== null && text.trim() === lines[index].text ? null : text;
    setSaving(true);
    setError('');
    try {
      setEdits(await saveTranscriptEdit(job.id, index, value));
      setEditing(null);
    } catch (saveError) {
      setError(apiErrorMessage(saveError, intl.formatMessage(messages.saveError)));
    }
    setSaving(false);
  };

  const reasons = (line: Line) => line.warnings.map((warning) => {
    const known = CHECK_REASONS.find(([start]) => warning.startsWith(start));
    return known ? intl.formatMessage(known[1]) : warning;
  });

  const duration = (line: Line) => {
    const seconds = Math.round(line.end - line.start);
    return seconds < 60 ? `${seconds} s` : clock(seconds);
  };

  // Once the text reads well: the service suggests a course from it. Corrections can't change after this.
  const suggest = async () => {
    setSuggesting(true);
    setSuggestError('');
    player.current?.pause();
    try {
      onSuggested(await suggestCourse(job.id));
    } catch (suggestFailure) {
      setSuggestError(apiErrorMessage(suggestFailure, intl.formatMessage(messages.suggestError)));
      setSuggesting(false);
    }
  };

  // The transcript as a text file, with the author's corrections.
  const download = () => {
    const rows = lines.map((line, index) => {
      const speaker = SPEAKERS[line.speaker];
      const text = textOf(index) ?? `(${speaker ? intl.formatMessage(speaker) : line.speaker}, ${duration(line)})`;
      return `[${clock(line.start)}] ${text}`;
    });
    const blob = new Blob([`${job.originalFilename}\n\n${rows.join('\n')}\n`], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${job.originalFilename.replace(/\.[^.]+$/, '')} - transcript.txt`;
    // In the page, and the file link kept a moment: Safari and Firefox start the download only after click().
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const shown = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => !onlyToCheck || toCheck(line, index));
  const leftToCheck = lines.filter(toCheck).length;

  return (
    <section className="recording-transcript" aria-labelledby="recording-transcript-title">
      <header className="recording-transcript__header">
        <h2 id="recording-transcript-title" className="recording-transcript__title">
          {intl.formatMessage(messages.title)}
        </h2>
        <p className="recording-transcript__intro">{intl.formatMessage(messages.intro)}</p>
      </header>

      {job.downloads?.clean && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={player}
          className="recording-transcript__player"
          controls
          preload="none"
          src={job.downloads.clean}
          aria-label={intl.formatMessage(messages.player)}
          onTimeUpdate={(event) => setHeard(lineAt(lines, event.currentTarget.currentTime))}
          onPlay={() => setPaused(false)}
          onPlaying={() => { wanted.current = null; refreshed.current = false; }}
          onPause={() => setPaused(true)}
          onError={onAudioError}
        />
      )}

      {transcript.isPending && transcript.fetchStatus !== 'idle' && (
        <Spinner animation="border" size="sm" screenReaderText={intl.formatMessage(messages.loading)} />
      )}
      {(transcript.isError || (!job.downloads?.transcriptJson && !transcript.data)) && (
        <Alert variant="danger">{intl.formatMessage(messages.loadError)}</Alert>
      )}

      {lines.length > 0 && (
        <>
          <div className="recording-transcript__toolbar">
            <span className="recording-transcript__summary">
              {intl.formatMessage(messages.summary, { lines: written.length, toCheck: leftToCheck })}
            </span>
            <Form.Switch
              checked={onlyToCheck}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setOnlyToCheck(event.target.checked)}
              className="recording-transcript__filter"
            >
              {intl.formatMessage(messages.onlyToCheck)}
            </Form.Switch>
            <Button variant="outline-primary" size="sm" onClick={download}>
              {intl.formatMessage(messages.download)}
            </Button>
          </div>

          {error && editing === null && <Alert variant="danger">{error}</Alert>}

          <ol className="recording-transcript__lines">
            {shown.map(({ line, index }) => {
              const time = clock(line.start);
              if (line.text === null) {
                const speaker = SPEAKERS[line.speaker];
                return (
                  // By position: two lines can start at the same moment (a line widened into a silence).
                  <li key={index} className="recording-transcript__line recording-transcript__line--skipped">
                    {playButton(line, index)}
                    <span className="recording-transcript__skipped">
                      {intl.formatMessage(messages.notWrittenDown, {
                        speaker: speaker ? intl.formatMessage(speaker) : line.speaker,
                        duration: duration(line),
                      })}
                    </span>
                  </li>
                );
              }
              const corrected = edits[index] !== undefined;
              const classes = [
                'recording-transcript__line',
                toCheck(line, index) ? 'recording-transcript__line--check' : '',
                index === heard ? 'recording-transcript__line--playing' : '',
              ];
              return (
                <li key={index} className={classes.filter(Boolean).join(' ')}>
                  {playButton(line, index)}
                  <div className="recording-transcript__body">
                    {editing === index ? (
                      <form
                        className="recording-transcript__edit"
                        onSubmit={(event: FormEvent) => { event.preventDefault(); save(index, draft); }}
                      >
                        <textarea
                          className="recording-transcript__textarea"
                          lang="bo"
                          value={draft}
                          rows={Math.max(2, Math.ceil(draft.length / 60))}
                          aria-label={intl.formatMessage(messages.lineText, { time })}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => { if (event.key === 'Escape') { setEditing(null); } }}
                          disabled={saving}
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                        />
                        {error && <p className="recording-transcript__error" role="alert">{error}</p>}
                        <div className="recording-transcript__edit-actions">
                          <Button variant="tertiary" size="sm" onClick={() => setEditing(null)} disabled={saving}>
                            {intl.formatMessage(messages.cancel)}
                          </Button>
                          <Button type="submit" variant="primary" size="sm" disabled={saving}>
                            {intl.formatMessage(saving ? messages.saving : messages.save)}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="recording-transcript__text" lang="bo">{textOf(index)}</p>
                        {toCheck(line, index) && (
                          <p className="recording-transcript__note">
                            <strong>{intl.formatMessage(messages.toCheck)}</strong> {reasons(line).join(' ')}
                          </p>
                        )}
                        {corrected && (
                          <p className="recording-transcript__note recording-transcript__note--corrected">
                            {intl.formatMessage(messages.corrected)}
                            <span aria-hidden="true"> · </span>
                            <Button
                              variant="link"
                              size="inline"
                              className="recording-transcript__undo"
                              disabled={saving}
                              onClick={() => save(index, null)}
                            >
                              {intl.formatMessage(messages.undo)}
                            </Button>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {editing !== index && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      iconBefore={Edit}
                      className="recording-transcript__correct"
                      aria-label={intl.formatMessage(messages.editLine, { time })}
                      disabled={editing !== null}
                      onClick={() => open(index)}
                    >
                      {intl.formatMessage(messages.edit)}
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
          {onlyToCheck && shown.length === 0 && (
            <p className="recording-transcript__empty">{intl.formatMessage(messages.noneToCheck)}</p>
          )}

          {/* The next step, always in view at the bottom of a long transcript. */}
          <div className="recording-transcript__next">
            <p className="recording-transcript__next-text">{intl.formatMessage(messages.nextStep)}</p>
            {suggestError && <p className="recording-transcript__error" role="alert">{suggestError}</p>}
            <Button
              variant="primary"
              className="recording-transcript__suggest"
              disabled={suggesting || editing !== null}
              onClick={suggest}
            >
              {intl.formatMessage(suggesting ? messages.suggesting : messages.suggest)}
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default TranscriptScreen;
