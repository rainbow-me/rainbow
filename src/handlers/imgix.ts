import { Source } from 'react-native-fast-image';
import parse from 'url-parse';

const shouldSignUri = (externalImageUri: string): string => {
  return externalImageUri;
};

// Determines whether an externalImageUri should be signed.
// It should be a non-empty string which points to a remote address.
// Other strings (such as those which point to local assets) should
// not be signed.
export const isPossibleToSignUri = (
  externalImageUri: string | undefined
): boolean => {
  if (typeof externalImageUri === 'string' && !!externalImageUri.length) {
    try {
      const { host } = parse(externalImageUri);
      return typeof host === 'string' && !!host.length;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`[Imgix]: Failed to parse "${externalImageUri}"!`, e);
      return false;
    }
  }
  return false;
};

export const maybeSignUri = (
  externalImageUri: string | undefined
): string | undefined => {
  if (
    typeof externalImageUri === 'string' &&
    !!externalImageUri.length &&
    isPossibleToSignUri(externalImageUri)
  ) {
    return shouldSignUri(externalImageUri);
  }
  return externalImageUri;
};

export const maybeSignSource = (source: Source): Source => {
  if (!!source && typeof source === 'object') {
    const { uri: externalImageUri, ...extras } = source;
    return {
      ...extras,
      uri: maybeSignUri(externalImageUri),
    };
  }
  return source;
};
