export default function isETH(address: string): boolean {
  return address?.toLowerCase() === 'eth';
}
