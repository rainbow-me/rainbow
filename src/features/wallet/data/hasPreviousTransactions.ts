import { type EthereumAddress } from '@/entities/wallet';

/** Returns whether the history service reports activity for the address. Network and response errors return `false`. */
export async function hasPreviousTransactions(address: EthereumAddress): Promise<boolean> {
  try {
    const response = await fetch(`https://aha.rainbow.me/?address=${address}`);
    if (!response.ok) return false;

    const body: { data: { addresses: Record<string, boolean> } } = await response.json();
    return body.data.addresses[address.toLowerCase()] === true;
  } catch {
    return false;
  }
}
