export default function formatURLForDisplay(url: string) {
  if (!url.includes('://')) {
    const pretty = url.replace('www.', '');
    return pretty.charAt(pretty.length - 1) === '/' ? pretty.substring(0, pretty.length - 1) : pretty;
  }
  const pretty = url.split('://')[1].replace('www.', '');
  return pretty.charAt(pretty.length - 1) === '/' ? pretty.substring(0, pretty.length - 1) : pretty;
}
