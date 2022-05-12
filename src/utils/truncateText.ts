export function truncateText(text: string) {
  if (text.length > 40) {
    return text.substring(0, 32) + '…';
  }

  return text;
}
