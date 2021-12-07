export const EventTypes = {
  ENS: {
    icon: `􀈐`,
    label: `Registered`,
    type: 'ens-registration',
  },
  MINT: {
    icon: `􀎛`,
    label: `Minted by `,
    type: 'mint',
  },
  SALE: {
    icon: `􀋢`,
    label: `Sold for `,
    type: 'successful',
  },
  TRANSFER: {
    icon: `􀈠`,
    label: `Sent to `,
    type: 'transfer',
  }
};

export const PaymentTokens = {
  ETH: 'ETH',
  WETH: 'WETH',
  DAI: 'DAI',
  USDC: 'USDC'
};