import { useState, useEffect, useCallback } from 'react';

export type VideoAccessError = 'unauthorized' | 'forbidden' | 'failed' | null;

export function useVideoAccess(lessonId: string) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<VideoAccessError>(null);

  const fetchVideo = useCallback(async () => {
    if (!lessonId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/stream`, {
        method: 'GET',
        // Next.js automatically includes Http-Only cookies for the session
      });

      if (response.status === 200) {
        const result = await response.json();
        if (result.success && result.data?.videoId) {
          setVideoId(result.data.videoId);
        } else {
          setError('failed');
        }
      } else if (response.status === 401) {
        setError('unauthorized');
      } else if (response.status === 403) {
        setError('forbidden');
      } else {
        setError('failed');
      }
    } catch (err) {
      console.error('[useVideoAccess]', err);
      setError('failed');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  return { videoId, loading, error, fetchVideo };
}
