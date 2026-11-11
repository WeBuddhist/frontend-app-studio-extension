import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Button, Dropdown, Icon,
} from '@openedx/paragon';
import { Check, Pause, PlayArrow } from '@openedx/paragon/icons';

import { apiErrorMessage, tagVoices } from '../data/api';
import { clock } from '../data/format';
import useServiceFile from '../data/useServiceFile';
import type { Job, SpeakerLabel } from '../data/api';
import messages from './messages';

// Each choice says what happens to that voice, so the author knows what the choice means.
type Message = typeof messages.labelTeacher;

const LABELS: { value: SpeakerLabel; message: Message; outcome: Message }[] = [
  { value: 'teacher', message: messages.labelTeacher, outcome: messages.writtenDown },
  { value: 'translator', message: messages.labelTranslator, outcome: messages.notWrittenDown },
  { value: 'chanting', message: messages.labelChanting, outcome: messages.notWrittenDown },
  { value: 'other', message: messages.labelOther, outcome: messages.notWrittenDown },
];

// A timeline block shows its voice's name only if it is at least this share of the recording.
const LABEL_MIN_SHARE = 0.07;

/** One turn of the service's timeline (1-voices/timeline.json): who speaks from when to when. */
interface Turn {
  start: number;
  end: number;
  group: string | null;
}

/** The service's 1-voices/waveform.json: how loud the recording is, one value (0 to 1) per slice of time. */
interface Waveform {
  seconds_per_level: number;
  levels: number[];
}

// The waveform is drawn with this many bars across the whole recording; each bar is the average
// loudness of its stretch of time, so the rise and fall of speech shows.
const WAVE_BARS = 200;

interface Bar {
  at: number;
  level: number;
}

const barsOf = ({ seconds_per_level: step, levels }: Waveform, total: number): Bar[] => (
  Array.from({ length: WAVE_BARS }, (_, index) => {
    const from = Math.floor((index * total) / WAVE_BARS / step);
    const to = Math.max(from + 1, Math.floor(((index + 1) * total) / WAVE_BARS / step));
    const slice = levels.slice(from, to);
    const level = slice.length ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0;
    return { at: ((index + 0.5) * total) / WAVE_BARS, level };
  })
);

/** One block's part of the waveform; silence still shows as a thin line. */
const Wave = ({ bars }: { bars: Bar[] }) => (
  <svg
    className="recording-voices__wave"
    viewBox={`0 0 ${bars.length} 100`}
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    {bars.map(({ at, level }, index) => {
      const height = Math.max(4, level * 100);
      return <rect key={at} x={index + 0.25} y={(100 - height) / 2} width={0.5} height={height} />;
    })}
  </svg>
);

// Time marks under the strip, where each part starts. Marks closer than this share of the strip to the
// previous one are left out, so a long recording with many turns stays readable; the end always shows.
const MARK_MIN_GAP = 0.08;

const marksFor = (starts: number[], total: number) => starts.concat(total).reduce<number[]>((marks, at) => {
  const previous = marks[marks.length - 1];
  if (previous === undefined || (at - previous) / total >= MARK_MIN_GAP) {
    return [...marks, at];
  }
  // Too close: the end of the recording wins over the mark before it (but never over 0:00).
  return at === total && marks.length > 1 ? [...marks.slice(0, -1), at] : marks;
}, []);

/** Neighbouring turns of the same voice as one block, so the strip isn't cut into slivers. */
const blocksOf = (timeline: Turn[]) => timeline.reduce<Turn[]>((blocks, turn) => {
  const last = blocks[blocks.length - 1];
  if (last && last.group === turn.group) {
    last.end = turn.end;
  } else {
    blocks.push({ ...turn });
  }
  return blocks;
}, []);

interface TagVoicesScreenProps {
  job: Job;
  /** Called with the queued job once the tags are saved. */
  onTagged: (job: Job) => void;
  /** The sample links expire after an hour; called to fetch fresh ones when a sample won't play. */
  onSamplesExpired: () => void;
}

/**
 * Recordings with more than one speaker: the service has grouped the voices and the job waits here.
 * The author sees where each voice speaks, plays a few short samples, and says who it is; only the
 * teacher is transcribed.
 */
const TagVoicesScreen = ({ job, onTagged, onSamplesExpired }: TagVoicesScreenProps) => {
  const intl = useIntl();
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, SpeakerLabel>>({});
  const [untagged, setUntagged] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // The voice whose row is hovered or focused: its parts of the strip stand out.
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const timeline = useServiceFile<Turn[]>(job.id, 'timeline', job.downloads?.timeline);
  // Recordings processed before the waveform was added have none: their strip is plain colour.
  const waveform = useServiceFile<Waveform>(job.id, 'waveform', job.downloads?.waveform);

  // Stop any sample when the screen goes away.
  useEffect(() => () => player.current?.pause(), []);

  const voiceIndex = Object.fromEntries(job.speakerGroups.map(({ group }, index) => [group, index]));
  const voiceName = (group: string) => intl.formatMessage(messages.voiceName, { number: voiceIndex[group] + 1 });
  const labelName = (label: SpeakerLabel) => intl.formatMessage(LABELS.find(({ value }) => value === label)!.message);

  // Which of each voice's samples its play button plays; "Hear another" moves on to the next one.
  const [sampleIndex, setSampleIndex] = useState<Record<string, number>>({});

  const play = (url: string) => {
    const audio = player.current;
    if (!audio) { return; }
    audio.src = url;
    audio.play().then(() => setPlaying(url)).catch(() => setPlaying(null));
  };

  const toggle = (url: string) => {
    if (playing === url) {
      player.current?.pause();
      setPlaying(null);
    } else {
      play(url);
    }
  };

  const hearAnother = (group: string, samples: string[]) => {
    const next = ((sampleIndex[group] ?? 0) + 1) % samples.length;
    setSampleIndex((current) => ({ ...current, [group]: next }));
    play(samples[next]);
  };

  const choose = (group: string, label: SpeakerLabel | '') => {
    setLabels(({ [group]: _previous, ...rest }) => (label ? { ...rest, [group]: label } : rest));
    setUntagged((current) => current.filter((item) => item !== group));
    setError('');
  };

  // "25 s" for a short voice, "12 min" for a long one.
  const duration = (minutes: number) => (
    minutes < 1.5
      ? intl.formatMessage(messages.durationSeconds, { seconds: Math.max(1, Math.round(minutes * 60)) })
      : intl.formatMessage(messages.durationMinutes, { minutes: Math.round(minutes) })
  );

  const teacherMinutes = job.speakerGroups
    .filter(({ group }) => labels[group] === 'teacher')
    .reduce((total, { minutes }) => total + minutes, 0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = job.speakerGroups.map(({ group }) => group).filter((group) => !labels[group]);
    setUntagged(missing);
    if (missing.length) { return; }
    if (!Object.values(labels).includes('teacher')) {
      setError(intl.formatMessage(messages.errorNoTeacher));
      return;
    }
    setSaving(true);
    setError('');
    player.current?.pause();
    try {
      onTagged(await tagVoices(job.id, labels));
    } catch (saveError) {
      setError(apiErrorMessage(saveError, intl.formatMessage(messages.errorSave)));
      setSaving(false);
    }
  };

  const blocks = timeline.data ? blocksOf(timeline.data) : [];
  const total = blocks.length ? blocks[blocks.length - 1].end : 0;
  const bars = waveform.data && total ? barsOf(waveform.data, total) : null;

  return (
    <form className="recording-voices" onSubmit={onSubmit} noValidate>
      <div className="recording-voices__header">
        <h2 className="recording-voices__title">{intl.formatMessage(messages.title)}</h2>
        <p className="recording-voices__intro">
          {intl.formatMessage(messages.intro, { count: job.speakerGroups.length })}
        </p>
      </div>

      {/* One player for every sample, so only one plays at a time. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={player}
        className="recording-voices__player"
        onEnded={() => setPlaying(null)}
        onError={() => {
          // A sample that won't load has most likely expired: ask for fresh links.
          if (player.current?.getAttribute('src')) { onSamplesExpired(); }
          setPlaying(null);
        }}
      />

      {blocks.length > 0 && (
        <figure className="recording-voices__timeline">
          <div
            className={`recording-voices__strip${bars ? ' recording-voices__strip--wave' : ''}`}
            role="img"
            aria-label={intl.formatMessage(messages.timelineLabel)}
          >
            {blocks.map((block) => {
              const silent = block.group === null;
              const tag = silent ? undefined : labels[block.group as string];
              const name = (silent && intl.formatMessage(messages.silence))
                || (tag && labelName(tag))
                || voiceName(block.group as string);
              const classes = [
                'recording-voices__block',
                `recording-voices__block--${silent ? 'silence' : voiceIndex[block.group as string] % 4}`,
                tag ? 'recording-voices__block--tagged' : '',
                highlighted && block.group !== highlighted ? 'recording-voices__block--dim' : '',
              ];
              return (
                <span
                  key={block.start}
                  className={classes.filter(Boolean).join(' ')}
                  style={{ flexGrow: block.end - block.start }}
                  title={`${name} · ${clock(block.start)}–${clock(block.end)}`}
                >
                  {/* Only blocks wide enough for a name show one; the rest show it on hover. */}
                  <span className="recording-voices__block-name">
                    {(block.end - block.start) / total >= LABEL_MIN_SHARE && name}
                  </span>
                  {bars && <Wave bars={bars.filter(({ at }) => at >= block.start && at < block.end)} />}
                </span>
              );
            })}
          </div>
          <figcaption className="recording-voices__axis" aria-hidden="true">
            {marksFor(blocks.map((block) => block.start), total).map((at) => (
              <span key={at} className="recording-voices__tick" style={{ left: `${(at / total) * 100}%` }}>
                {clock(at)}
              </span>
            ))}
          </figcaption>
        </figure>
      )}

      <ul className="recording-voices__list">
        {job.speakerGroups.map(({ group, minutes, samples }) => {
          const name = voiceName(group);
          const invalid = untagged.includes(group);
          const current = sampleIndex[group] ?? 0;
          const url = samples[current];
          const isPlaying = playing === url;
          const selectId = `recording-voice-${group}`;
          return (
            <li
              key={group}
              className={`recording-voices__voice${invalid ? ' recording-voices__voice--invalid' : ''}`}
              onMouseEnter={() => setHighlighted(group)}
              onMouseLeave={() => setHighlighted(null)}
              onFocus={() => setHighlighted(group)}
              onBlur={() => setHighlighted(null)}
            >
              <button
                type="button"
                className={`recording-voices__play recording-voices__play--${voiceIndex[group] % 4}`}
                aria-pressed={isPlaying}
                aria-label={intl.formatMessage(isPlaying ? messages.pauseVoice : messages.playVoice, { voice: name })}
                onClick={() => toggle(url)}
              >
                <Icon src={isPlaying ? Pause : PlayArrow} />
              </button>

              <div className="recording-voices__info">
                <span className="recording-voices__name">{name}</span>
                <span className="recording-voices__meta">
                  {duration(minutes)}
                  {samples.length > 1 && (
                    <>
                      <span aria-hidden="true"> · </span>
                      {intl.formatMessage(messages.sampleOf, { number: current + 1, count: samples.length })}
                      <span aria-hidden="true"> · </span>
                      <button
                        type="button"
                        className="recording-voices__another"
                        onClick={() => hearAnother(group, samples)}
                      >
                        {intl.formatMessage(messages.hearAnother)}
                      </button>
                    </>
                  )}
                </span>
              </div>

              <div className="recording-voices__choice">
                <Dropdown
                  className="recording-voices__who"
                  onSelect={(value: string | null) => value && choose(group, value as SpeakerLabel)}
                >
                  <Dropdown.Toggle
                    id={selectId}
                    variant="tertiary"
                    disabled={saving}
                    aria-invalid={invalid}
                    aria-label={`${intl.formatMessage(messages.whoIsThisVoice, { voice: name })} ${
                      labels[group] ? labelName(labels[group]) : ''}`.trim()}
                    className={`recording-voices__who-toggle${labels[group] ? ' recording-voices__who-toggle--chosen' : ''}`}
                  >
                    {labels[group] ? labelName(labels[group]) : intl.formatMessage(messages.chooseWho)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="recording-voices__who-menu">
                    {LABELS.map(({ value, message, outcome }) => {
                      const chosen = labels[group] === value;
                      return (
                        <Dropdown.Item
                          key={value}
                          as="button"
                          type="button"
                          eventKey={value}
                          active={chosen}
                          className="recording-voices__who-option"
                        >
                          <span className="recording-voices__who-text">
                            <span className="recording-voices__who-label">{intl.formatMessage(message)}</span>
                            <span className="recording-voices__who-outcome">{intl.formatMessage(outcome)}</span>
                          </span>
                          {chosen && <Icon src={Check} className="recording-voices__who-check" />}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
                {invalid && (
                  <p className="recording-voices__error" role="alert">{intl.formatMessage(messages.errorUntagged)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="recording-voices__tip">{intl.formatMessage(messages.splitTip)}</p>

      {error && <Alert variant="danger" className="recording-voices__alert">{error}</Alert>}

      <div className="recording-voices__footer">
        <span className="recording-voices__summary">
          {teacherMinutes > 0
            ? intl.formatMessage(messages.teacherSummary, { duration: duration(teacherMinutes) })
            : intl.formatMessage(messages.noTeacherYet)}
        </span>
        <Button type="submit" variant="primary" className="recording-voices__submit" disabled={saving}>
          {intl.formatMessage(saving ? messages.saving : messages.submit)}
        </Button>
      </div>
    </form>
  );
};

export default TagVoicesScreen;
