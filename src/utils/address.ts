import { checkIsValidAddressOrDomain } from '../helpers/validators';
import { EthereumAddress } from '@/entities';

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

export const maxLength = 42;

export default {
  getEthereumAddressFromQRCodeData,
  maxLength,
};
