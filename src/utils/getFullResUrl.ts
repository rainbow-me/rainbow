export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';

// List of params for Google Cloud Storage available here
// https://github.com/albertcht/python-gcs-image

export const getFullResUrl = (url: string | null | undefined) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return url.replace(/=s\d+$/, '=s0'); // s0 gets the original size from google
  }
  return url;
};
