export default function getExchangeIconUrl(protocol: string): string | null {
  if (!protocol) return null;
  const parsedProtocol = protocol?.replace(' ', '')?.toLowerCase();
  return `https://raw.githubusercontent.com/rainbow-me/assets/master/exchanges/${parsedProtocol}.png`;
}
