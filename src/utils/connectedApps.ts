export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export const getDappHost = (url: string) => {
  if (!url) return '';
  try {
    const host = new URL(url).host;
    if (host.indexOf('www.') === 0) {
      return host.replace('www.', '');
    }
    return host;
  } catch (err) {
    return '';
  }
};

export const getDappHostname = (url: string) => {
  if (!url) return '';
  try {
    const urlObject = new URL(url);
    let hostname;
    const subdomains = urlObject.hostname.split('.');
    if (subdomains.length === 2) {
      hostname = urlObject.hostname;
    } else if (subdomains.length > 2) {
      hostname = `${subdomains[subdomains.length - 2]}.${subdomains[subdomains.length - 1]}`;
    }
    return hostname;
  } catch (err) {
    return '';
  }
};

export const getPublicAppIcon = (host: string) => `https://icons.duckduckgo.com/ip3/${host}.ico`;

const displayDappNames: {
  [name: string]: { name: string };
} = {
  '1inch.io': {
    name: '1inch',
  },
  '88mph.app': {
    name: '88mph',
  },
  'aave.com': {
    name: 'Aave',
  },
  'artblocks.io': {
    name: 'Art Blocks',
  },
  'astrofrens.com': {
    name: 'Astro Frens',
  },
  'badger.finance': {
    name: 'Badger DAO',
  },
  'balancer.exchange': {
    name: 'Balancer',
  },
  'blit.house': {
    name: 'Blit House',
  },
  'blitmap.com': {
    name: 'Blitmap',
  },
  'collab.land': {
    name: 'Collab.Land',
  },
  'compound.finance': {
    name: 'Compound',
  },
  'cream.finance': {
    name: 'Cream',
  },
  'curve.fi': {
    name: 'Curve',
  },
  'defisaver.com': {
    name: 'DeFi Saver',
  },
  'dydx.exchange': {
    name: 'dYdX',
  },
  'ens.domains': {
    name: 'ENS',
  },
  'etherscan.io': {
    name: 'Etherscan',
  },
  'flexa.network': {
    name: 'Flexa',
  },
  'foundation.app': {
    name: 'Foundation',
  },
  'furucombo.app': {
    name: 'Furucombo',
  },
  'gnosis-safe.io': {
    name: 'Gnosis Safe',
  },
  'indexcoop.com': {
    name: 'Index',
  },
  'instadapp.io': {
    name: 'Instadapp',
  },
  'kyberswap.com': {
    name: 'KyberSwap',
  },
  'matcha.xyz': {
    name: 'Matcha',
  },
  'mirror.xyz': {
    name: 'Mirror',
  },
  'mstable.org': {
    name: 'mStable',
  },
  'mycrypto.com': {
    name: 'MyCrypto',
  },
  'nft20.io': {
    name: 'NFT20',
  },
  'niftygateway.com': {
    name: 'Nifty Gateway',
  },
  'oasis.app': {
    name: 'Oasis',
  },
  'opensea.io': {
    name: 'OpenSea',
  },
  'optimism.io': {
    name: 'Optimism Gateway',
  },
  'partybid.app': {
    name: 'PartyBid',
  },
  'piedao.org': {
    name: 'PieDAO',
  },
  'pooltogether.com': {
    name: 'PoolTogether',
  },
  'punks.house': {
    name: 'Punk House',
  },
  'quickswap.exchange': {
    name: 'QuickSwap',
  },
  'rainbowkit.com': {
    name: 'RainbowKit',
  },
  'rarible.com': {
    name: 'Rarible',
  },
  'snapshot.org': {
    name: 'Snapshot',
  },
  'superrare.com': {
    name: 'SuperRare',
  },
  'sushi.com': {
    name: 'Sushi',
  },
  'swerve.fi': {
    name: 'Swerve',
  },
  'synthetix.exchange': {
    name: 'Synthetix',
  },
  'tokensets.com': {
    name: 'TokenSets',
  },
  'twitter.com': {
    name: 'Twitter',
  },
  'umaproject.org': {
    name: 'UMA',
  },
  'unisocks.exchange': {
    name: 'Unisocks Exchange',
  },
  'uniswap.org': {
    name: 'Uniswap',
  },
  'walletconnect.org': {
    name: 'WalletConnect',
  },
  'yam.finance': {
    name: 'YAM',
  },
  'yearn.finance': {
    name: 'yearn',
  },
  'zapper.fi': {
    name: 'Zapper',
  },
  'zerion.io': {
    name: 'Zerion',
  },
  'zora.co': {
    name: 'Zora',
  },
  'base.org': {
    name: 'Base',
  },
  'zora.energy': {
    name: 'Zora Energy',
  },
};

export const getHardcodedDappInformation = (hostName: string) => displayDappNames?.[hostName];
