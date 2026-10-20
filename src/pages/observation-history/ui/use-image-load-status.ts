import { useState } from 'react';

export type ImageLoadStatus = 'pending' | 'failed';

/**
 * Tracks failures per URI, so a refreshed signed URL is retried instead of keeping the
 * previous failure. Loading feedback is drawn behind the image and needs no load event.
 */
export function useImageLoadStatus(uri: string | null) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const status: ImageLoadStatus = !uri || failedUri === uri ? 'failed' : 'pending';

  return {
    status,
    onError: () => {
      if (uri) setFailedUri(uri);
    },
  };
}
