import { UniqueId, AddressOrEth } from '@/components/swaps/types/assets';
import { checkIsValidAddressOrDomain } from '@/helpers/validators';
import { EthereumAddress } from '@/entities';
import { ChainId } from '@/chains/types';

/**
 * @desc get ethereum address from raw QR Code data
 * @param  {String}  data - qr code data
 * @return {String}  address - ethereum address
 */
export const getEthereumAddressFromQRCodeData = async (data: string): Promise<EthereumAddress | null> => {
  if (!data) return null;

  const parts = data.split(':');

  if (parts[0] === 'ethereum' && (await checkIsValidAddressOrDomain(parts[1]))) {
    return parts[1];
  }
  if (await checkIsValidAddressOrDomain(parts[0])) {
    return parts[0];
  }

  return null;
};

export function deriveAddressAndChainWithUniqueId(uniqueId: UniqueId) {
  const fragments = uniqueId.split('_');
  const address = fragments[0] as AddressOrEth;
  const chain = parseInt(fragments[1], 10) as ChainId;
  return {
    address,
    chain,
  };
}

export const maxLength = 42;

export default {
  getEthereumAddressFromQRCodeData,
  maxLength,
};
