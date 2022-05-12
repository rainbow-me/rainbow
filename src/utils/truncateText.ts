const LIMIT = 32;

export function truncateText(text: string) {
  if (text.length > LIMIT) {
    return text.substring(0, LIMIT) + '…';
  }

  return text;
}
