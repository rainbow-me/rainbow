export default function isHttpUrl(value: string | number | null | undefined) {
  return typeof value === 'string' && value.startsWith('http://');
}
