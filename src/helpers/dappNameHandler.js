/* eslint-disable import/no-commonjs */
import URL from 'url-parse';

const DisplayDappNames = Object.freeze({
  '1inch.exchange': {
    name: '1inch',
    uri: null,
  },
  '88mph.app': {
    name: '88mph',
    uri: require('../assets/dappLogos/88mph.app.jpg'),
  },
  'aave.com': {
    name: 'Aave',
    uri: require('../assets/dappLogos/aave.com.jpg'),
  },
  'balancer.exchange': {
    name: 'Balancer',
    uri: null,
  },
  'compound.finance': {
    name: 'Compound',
    uri: require('../assets/dappLogos/compound.finance.jpg'),
  },
  'cream.finance': {
    name: 'Cream',
    uri: require('../assets/dappLogos/cream.finance.jpg'),
  },
  'curve.fi': {
    name: 'Curve',
    uri: null,
  },
  'defisaver.com': {
    name: 'DeFi Saver',
    uri: require('../assets/dappLogos/defisaver.com.jpg'),
  },
  'dydx.exchange': {
    name: 'dYdX',
    uri: require('../assets/dappLogos/dydx.exchange.jpg'),
  },
  'instadapp.io': {
    name: 'Instadapp',
    uri: null,
  },
  'kyberswap.com': {
    name: 'KyberSwap',
    uri: require('../assets/dappLogos/kyberswap.com.jpg'),
  },
  'matcha.xyz': {
    name: 'Matcha',
    uri: require('../assets/dappLogos/matcha.xyz.jpg'),
  },
  'mstable.org': {
    name: 'mStable',
    uri: require('../assets/dappLogos/mstable.org.jpg'),
  },
  'oasis.app': {
    name: 'Oasis',
    uri: null,
  },
  'opensea.io': {
    name: 'OpenSea',
    uri: null,
  },
  'piedao.org': {
    name: 'PieDAO',
    uri: null,
  },
  'pooltogether.com': {
    name: 'PoolTogether',
    uri: require('../assets/dappLogos/pooltogether.com.jpg'),
  },
  'rarible.com': {
    name: 'Rarible',
    uri: require('../assets/dappLogos/rarible.com.jpg'),
  },
  'sushiswapclassic.org': {
    name: 'SushiSwap',
    uri: require('../assets/dappLogos/sushiswapclassic.org.jpg'),
  },
  'swerve.fi': {
    name: 'Swerve',
    uri: require('../assets/dappLogos/swerve.fi.jpg'),
  },
  'synthetix.exchange': {
    name: 'Synthetix',
    uri: require('../assets/dappLogos/synthetix.exchange.jpg'),
  },
  'umaproject.org': {
    name: 'UMA',
    uri: null,
  },
  'uniswap.org': {
    name: 'Uniswap',
    uri: null,
  },
  'walletconnect.org': {
    name: 'WalletConnect',
    uri: null,
  },
  'yam.finance': {
    name: 'YAM',
    uri: require('../assets/dappLogos/yam.finance.jpg'),
  },
  'yearn.finance': {
    name: 'yearn',
    uri: null,
  },
  'zapper.fi': {
    name: 'Zapper',
    uri: require('../assets/dappLogos/zapper.fi.jpg'),
  },
  'zerion.io': {
    name: 'Zerion',
    uri: null,
  },
});

export const dappNameOverride = url => {
  const hostname = getDappHostname(url);
  return DisplayDappNames[hostname]?.name;
};

export const dappLogoOverride = url => {
  const hostname = getDappHostname(url);
  return DisplayDappNames[hostname]?.uri;
};

export const getDappHostname = url => {
  const urlObject = new URL(url);
  let hostname;
  const subdomains = urlObject.hostname.split('.');
  if (subdomains.length === 2) {
    hostname = urlObject.hostname;
  } else {
    hostname = `${subdomains[subdomains.length - 2]}.${
      subdomains[subdomains.length - 1]
    }`;
  }
  return hostname;
};
