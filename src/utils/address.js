import { isValidAddress } from '@rainbow-me/rainbow-common';

/**
 * @desc get ethereum address from raw QR Code data
 * @param  {String}  data - qr code data
 * @return {String}  address - ethereum address
 */
export const getEthereumAddressFromQRCodeData = (data) => {
  if (!data) return null;

  const parts = data.split(':');

  if (parts[0] === 'ethereum' && isValidAddress(parts[1])) {
    return parts[1];
  }
  if (isValidAddress(parts[0])) {
    return parts[0];
  }

  return null;
};
