export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const size = 5000;

export const getFullResUrl = (url: string | null | undefined) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size}`;
  }
  return url;
};
