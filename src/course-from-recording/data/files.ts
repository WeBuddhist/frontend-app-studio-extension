// The same rules as Studio's (course_from_recording/serializers.py), checked here first so the author
// hears about a wrong file before uploading it.

const CONTENT_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
};

export const ACCEPTED_EXTENSIONS = Object.keys(CONTENT_TYPES);

export const extensionOf = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
};

/** 'ok' when the file can be uploaded, or the reason it can't. ``maxMb`` is Studio's limit. */
export const checkFile = (file: File, maxMb: number): 'ok' | 'type' | 'size' => {
  if (!(extensionOf(file.name) in CONTENT_TYPES)) { return 'type'; }
  if (file.size > maxMb * 1024 * 1024) { return 'size'; }
  return 'ok';
};

/** The browser's audio type, or one from the extension when the browser gives none (it often doesn't). */
export const contentTypeOf = (file: File): string => (
  file.type.startsWith('audio/') ? file.type : CONTENT_TYPES[extensionOf(file.name)]
);

/** Studio's upload limit for people: '2 GB', or '500 MB' when it isn't whole gigabytes. */
export const formatLimit = (megabytes: number): string => (
  megabytes % 1024 === 0 ? `${megabytes / 1024} GB` : `${megabytes} MB`
);

export const formatSize = (bytes: number): string => (
  bytes >= 1024 * 1024 * 1024
    ? `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`
);
