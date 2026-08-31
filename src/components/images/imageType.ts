import { isImageCdnUrl } from '@/handlers/imageCdn';
import { memoFn } from '@/utils/memoFn';

const fastImageExtension = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpeg',
  bmp: 'bmp',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
} as const;

type FastImageExtensions = keyof typeof fastImageExtension;
export type DetectedImageExtension = FastImageExtensions | 'unknown';

const pathRegex = /fm=([a-z]+)/;

/**
 * Derives the image format a URL will return.
 *
 * For our own image CDNs the path is a percent-encoded source URL, so its file
 * extension describes the source rather than the response. The `fm` parameter
 * is the only reliable signal there, and png is assumed when it is absent.
 *
 * Every other URL is sniffed from the file extension.
 */
export const getImageType = memoFn((path: string): DetectedImageExtension => {
  try {
    const url = new URL(path);
    if (isImageCdnUrl(url)) {
      const [, type = 'png'] = path.match(pathRegex) || [];
      return fastImageExtension[type as FastImageExtensions] || 'unknown';
    }
    const pathname = url.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || '';
    return fastImageExtension[extension as FastImageExtensions] || 'unknown';
  } catch {
    return 'unknown';
  }
});
