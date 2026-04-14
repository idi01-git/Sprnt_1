'use client';

import { useState } from 'react';
import { useVideoAccess } from '@/hooks/useVideoAccess';
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl, extractYouTubeId } from '@/lib/youtube';

interface VideoPlayerProps {
  lessonId?: string;
  videoUrl?: string;
  poster?: string;
  title?: string;
  onProgress?: (progress: { currentTime: number; duration: number; percent: number }) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  startTime?: number;
  playbackRate?: number;
  onAccessDenied?: () => void;
  onUnauthorized?: () => void;
  isFreePreview?: boolean;
}

export function VideoPlayer({
  lessonId,
  videoUrl,
  title,
  autoPlay = false,
  isFreePreview = false,
}: VideoPlayerProps) {
  const [videoEnded, setVideoEnded] = useState(false);

  const useLessonId = !videoUrl && !!lessonId;
  const { videoId, loading, error } = useVideoAccess(useLessonId ? lessonId! : '');

  const directVideoId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const displayVideoId = useLessonId ? videoId : directVideoId;
  const embedUrl = displayVideoId ? buildYouTubeEmbedUrl(displayVideoId, autoPlay) : null;
  const watchUrl = videoUrl ? buildYouTubeWatchUrl(videoUrl) : (displayVideoId ? buildYouTubeWatchUrl(displayVideoId) : null);

  if (loading && useLessonId) {
    return (
      <div className="relative aspect-video flex items-center justify-center bg-black/90 rounded-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (error || !displayVideoId) {
    return (
      <div className="relative aspect-video flex items-center justify-center bg-black/90 rounded-xl px-4">
        <p className="text-white text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {error === 'unauthorized'
            ? 'Please log in to view this video.'
            : error === 'forbidden'
              ? 'You do not have access to this video.'
              : 'Failed to load video. Please try again.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl bg-black">
      <iframe
        src={embedUrl || undefined}
        title={title || 'Video Player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full border-0"
      />
      
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <h3 className="text-white font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        </div>
      )}

      {watchUrl && (
        <div className="absolute bottom-3 right-3 z-10">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Open on YouTube
          </a>
        </div>
      )}

      {isFreePreview && videoEnded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-purple-200 flex flex-col items-center gap-6 max-w-md text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Preview Completed</p>
              <p className="text-base text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>Enroll now to access all 15 days of content, quizzes, and your certificate!</p>
            </div>
            <a href="/pricing" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Enroll Now
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
