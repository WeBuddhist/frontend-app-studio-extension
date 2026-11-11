import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * A JSON file the service saved in the job's folder, fetched once by its short-lived download link
 * (a plain request: the link is signed, so it needs no Open edX login).
 */
const useServiceFile = <T extends unknown>(jobId: string, name: string, url: string | undefined) => {
  const query = useQuery({
    // Not keyed by the link: it changes every time the job is read, but the file doesn't.
    queryKey: ['course-from-recording', name, jobId],
    queryFn: async (): Promise<T> => {
      const response = await fetch(url as string);
      if (!response.ok) { throw new Error(`${name}: ${response.status}`); }
      return response.json();
    },
    enabled: Boolean(url),
    staleTime: Infinity,
    retry: 2,
  });
  const { isError, refetch } = query;
  // A file that failed to load (e.g. its link had expired) is tried again once the page has fresh links.
  useEffect(() => {
    if (isError && url) { refetch(); }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  return query;
};

export default useServiceFile;
