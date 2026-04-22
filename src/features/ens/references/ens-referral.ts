export const ENS_REFERRAL_CONTRACTS = {
  mainnet: {
    unwrappedRegistrarController:
      '0x59e16fccd424cc24e280be16e11bcd56fb0ce547',
    universalRenewalWithReferrer:
      '0xf55575Bde5953ee4272d5CE7cdD924c74d8fA81A',
  },
  sepolia: {
    unwrappedRegistrarController:
      '0xfb3ce5d01e0f33f41dbb39035db9745962f1f968',
    universalRenewalWithReferrer:
      '0x7AB2947592C280542e680Ba8f08A589009da8644',
  },
} as const;

const RAINBOW_REFERRER_ADDRESS = '0xYourRainbowAddressHere'; // TODO: set before merging

export function encodeReferrer(address: string = RAINBOW_REFERRER_ADDRESS): `0x${string}` {
  const stripped = address.replace(/^0x/, '').toLowerCase().padStart(40, '0');
  return `0x${'00'.repeat(12)}${stripped}` as `0x${string}`;
}

export const RAINBOW_REFERRER = encodeReferrer();
