/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const normalized = input.startsWith('http') ? input : `https://${input}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const shortId = url.pathname.split('/').filter(Boolean)[0];
      return shortId && /^[a-zA-Z0-9_-]{11}$/.test(shortId) ? shortId : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      const marker = parts[0];
      const candidate = ['embed', 'shorts', 'live'].includes(marker) ? parts[1] : null;
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
    }
  } catch {
    // Fall through to regex parsing for malformed but still parseable inputs.
  }

  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function buildYouTubeEmbedUrl(input: string, autoPlay = false): string | null {
  const videoId = extractYouTubeId(input);
  if (!videoId) return null;

  const url = new URL(`https://www.youtube.com/embed/${videoId}`);
  url.searchParams.set('autoplay', autoPlay ? '1' : '0');
  url.searchParams.set('rel', '0');
  url.searchParams.set('modestbranding', '1');
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('iv_load_policy', '3');
  url.searchParams.set('fs', '1');

  return url.toString();
}

export function buildYouTubeWatchUrl(input: string): string | null {
  const videoId = extractYouTubeId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}
