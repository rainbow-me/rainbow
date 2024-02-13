import parse from 'url-parse';

// Defines whether a given uri corresponds to a set of possible file extensions.
// It enforces the concept that uris must use https, that the evaluated url from
// url-parse matches what has been provided and the url ends with a supported extension.
export default function isSupportedUriExtension(uri: string, extensions: readonly string[]): boolean {
  if (typeof uri !== 'string' || !Array.isArray(extensions)) {
    return false;
  }
  try {
    const { href, pathname, protocol } = parse(uri || '');
    const supported = extensions.reduce((maybeSupported: boolean, ext: string): boolean => {
      return maybeSupported || (typeof ext === 'string' && pathname.toLowerCase().endsWith(ext.toLowerCase()));
    }, false);
    return href === uri && supported && protocol === 'https:';
  } catch (e) {
    return false;
  }
}
