export default function isETH(address: string | undefined): boolean {
  return address?.toLowerCase() === 'eth';
}
