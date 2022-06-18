import networkTypes from './networkTypes';
import { AssetTypes } from '@rainbow-me/entities';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import { parseAssetName, parseAssetSymbol } from '@rainbow-me/parsers';
import { getTokenMetadata } from '@rainbow-me/utils';

export const smallObj = {
  a: 1,
  b: 2,
  company: 'ABC1',
  country: 'IN',
  id: 1001,
  name: 'Some',
  priceObj: {
    amount: 100,
    currency: 'USD',
  },
  result: 0,
  zip: 1,
};
export const largeObj = {
  eight: {
    a: 8,
    b: 8,
    company: 'ABC2',
    country: 'IN',
    id: 107,
    name: 'Some',
    priceObj: {
      amount: 107,
      currency: 'USD',
    },
    result: 0,
    zip: 8,
  },
  eight1: {
    a: 8,
    b: 8,
    company: 'ABC2',
    country: 'IN',
    id: 107,
    name: 'Some',
    priceObj: {
      amount: 107,
      currency: 'USD',
    },
    result: 0,
    zip: 8,
  },
  five: {
    a: 5,
    b: 5,
    company: 'ABC2',
    country: 'IN',
    id: 104,
    name: 'Some',
    priceObj: {
      amount: 104,
      currency: 'USD',
    },
    result: 0,
    zip: 5,
  },
  five1: {
    a: 5,
    b: 5,
    company: 'ABC2',
    country: 'IN',
    id: 104,
    name: 'Some',
    priceObj: {
      amount: 104,
      currency: 'USD',
    },
    result: 0,
    zip: 5,
  },
  four: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 103,
    name: 'Some',
    priceObj: {
      amount: 103,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  four1: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 103,
    name: 'Some',
    priceObj: {
      amount: 103,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  nine: {
    a: 9,
    b: 9,
    company: 'ABC2',
    country: 'IN',
    id: 108,
    name: 'Some',
    priceObj: {
      amount: 108,
      currency: 'USD',
    },
    result: 0,
    zip: 9,
  },
  nine1: {
    a: 9,
    b: 9,
    company: 'ABC2',
    country: 'IN',
    id: 108,
    name: 'Some',
    priceObj: {
      amount: 108,
      currency: 'USD',
    },
    result: 0,
    zip: 9,
  },
  one: {
    a: 1,
    b: 1,
    company: 'ABC1',
    country: 'IN',
    id: 100,
    name: 'Some',
    priceObj: {
      amount: 100,
      currency: 'USD',
    },
    result: 0,
    zip: 1,
  },
  one1: {
    a: 1,
    b: 1,
    company: 'ABC1',
    country: 'IN',
    id: 100,
    name: 'Some',
    priceObj: {
      amount: 100,
      currency: 'USD',
    },
    result: 0,
    zip: 1,
  },
  seven: {
    a: 7,
    b: 7,
    company: 'ABC2',
    country: 'IN',
    id: 106,
    name: 'Some',
    priceObj: {
      amount: 106,
      currency: 'USD',
    },
    result: 0,
    zip: 7,
  },
  seven1: {
    a: 7,
    b: 7,
    company: 'ABC2',
    country: 'IN',
    id: 106,
    name: 'Some',
    priceObj: {
      amount: 106,
      currency: 'USD',
    },
    result: 0,
    zip: 7,
  },
  six: {
    a: 6,
    b: 6,
    company: 'ABC2',
    country: 'IN',
    id: 105,
    name: 'Some',
    priceObj: {
      amount: 105,
      currency: 'USD',
    },
    result: 0,
    zip: 6,
  },
  six1: {
    a: 6,
    b: 6,
    company: 'ABC2',
    country: 'IN',
    id: 105,
    name: 'Some',
    priceObj: {
      amount: 105,
      currency: 'USD',
    },
    result: 0,
    zip: 6,
  },
  ten: {
    a: 10,
    b: 10,
    company: 'ABC2',
    country: 'IN',
    id: 109,
    name: 'Some',
    priceObj: {
      amount: 109,
      currency: 'USD',
    },
    result: 0,
    zip: 10,
  },
  ten1: {
    a: 10,
    b: 10,
    company: 'ABC2',
    country: 'IN',
    id: 109,
    name: 'Some',
    priceObj: {
      amount: 109,
      currency: 'USD',
    },
    result: 0,
    zip: 10,
  },
  three: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 102,
    name: 'Some',
    priceObj: {
      amount: 102,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  three1: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 102,
    name: 'Some',
    priceObj: {
      amount: 102,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  two: {
    a: 2,
    b: 2,
    company: 'ABC2',
    country: 'IN',
    id: 101,
    name: 'Some',
    priceObj: {
      amount: 101,
      currency: 'USD',
    },
    result: 0,
    zip: 2,
  },
  two1: {
    a: 2,
    b: 2,
    company: 'ABC2',
    country: 'IN',
    id: 101,
    name: 'Some',
    priceObj: {
      amount: 101,
      currency: 'USD',
    },
    result: 0,
    zip: 2,
  },
};
export const pathsArr = ['eth', 'btc', 'usdt', 'usdc', 'bnb'];
export const smallArr = Array.from(Array(5)).map((_, i) => ({
  ...smallObj,
  a: i,
  b: i / 2,
  id: i + 1,
}));
export const arr = Array.from(Array(28)).map((_, i) => ({
  ...smallObj,
  a: i,
  b: i / 2,
  id: i + 1,
}));

export const parseAssetTest = ({ asset_code: address, ...asset } = {}) => {
  const metadata = getTokenMetadata(asset.mainnet_address || address);
  const name = parseAssetName(metadata, asset.name);
  const symbol = parseAssetSymbol(metadata, asset.symbol);
  const type =
    asset.type === AssetTypes.uniswap ||
    asset.type === AssetTypes.uniswapV2 ||
    asset.type === AssetTypes.arbitrum ||
    asset.type === AssetTypes.optimism ||
    asset.type === AssetTypes.polygon
      ? asset.type
      : AssetTypes.token;

  const parsedAsset = {
    ...asset,
    ...metadata,
    address,
    isNativeAsset: isNativeAsset(
      address,
      asset.network || networkTypes.mainnet
    ),
    name,
    symbol,
    type,
    uniqueId: address
      ? asset.network && asset.network !== networkTypes.mainnet
        ? `${address}_${asset.network}`
        : address
      : name,
  };

  return parsedAsset;
};
export const fnReturnId = v => v?.id;
export const isIdEven = v => v?.id % 2;
export const addValue = item => item.a + item.b;
// export const addValue = item => item.asset.decimals + item.asset.asset_code;
export const addValueDestructuring = ({ a, b }) => a + b;
export const payloadForLoop = i => {
  i.asset.priceObj = {
    amount: i.asset.price.value,
    decimals: i.asset.decimals,
  };
};

export const forOfArr = arr => {
  for (const element of arr) {
    payloadForLoop(element);
  }
};

export const forLoop = arr => {
  for (let i = 0; i < arr.length; i++) {
    payloadForLoop(arr[i]);
  }
};

//Array.map vs lodash.map vs for vs for..of
export const forOfLikeMap = (arr, payload) => {
  const result = [];
  for (const { asset } of arr) {
    result.push(payload(asset));
  }
  return result;
};
export const forLikeMap = (arr, payload) => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i] = payload(arr[i].asset);
  }
  return result;
};
export const forOfLikeMap1 = arr => {
  const result = [];
  for (const v of arr) {
    result.push(v.a + v.b);
  }
  return result;
};
export const forLikeMap1 = arr => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i] = arr[i].a + arr[i].b;
  }
  return result;
};

export const forOfLikeReduce = arr => {
  let acc = 0;
  for (const { asset } of arr) {
    acc += asset.price.value;
  }
  return acc;
};
export const forLoopReduce = arr => {
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += arr[i].asset.price.value;
  }
  return acc;
};

export const forOfLikeReduceObj = arr => {
  let acc = {};
  for (const { asset } of arr) {
    acc[asset.asset_code] = asset;
  }
  return acc;
};
export const forLoopReduceObj = arr => {
  let acc = {};
  for (let i = 0; i < arr.length; i++) {
    acc[arr[i].asset.asset_code] = arr[i].asset;
  }
  return acc;
};
export const forOfLikeReduceObjSpread = arr => {
  let acc = {};
  for (const { asset } of arr) {
    acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
  }
  return acc;
};
export const forLoopReduceObjSpread = arr => {
  let acc = {};
  for (let i = 0; i < arr.length; i++) {
    acc[arr[i].asset.asset_code] = {
      ...arr[i].asset,
      uniqueId: arr[i].asset.asset_code,
    };
  }
  return acc;
};

export const pickFlattenReduce = (obj, paths) => {
  return paths.reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
      return acc;
    }
    return acc;
  }, {});
};
export const pickFlattenKeys = (obj, paths) => {
  return Object.keys(obj)
    .filter(key => paths.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};
export const pickFlattenFromEntries = (obj, paths) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => paths.includes(key))
  );
};

export const pickBy = (obj, predicate) => {
  return Object.keys(obj)
    .filter(k => predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

export const omitForIn = (obj, keysToOmit) => {
  const keys = Array.isArray(keysToOmit) ? keysToOmit : [keysToOmit];
  const newObj = {};
  for (const key in obj) {
    if (!keys.includes(key)) newObj[key] = obj[key];
  }
  return newObj;
};
export const omitForInWithSet = (obj, keys) => {
  const keysArr = Array.isArray(keys) ? keys : [keys];
  const newObj = {};
  const keysToOmit = new Set(keysArr);
  for (const key in obj) {
    if (!keysToOmit.has(key)) newObj[key] = obj[key];
  }
  return newObj;
};
export const omitReduce = (obj, keysToOmit) =>
  keysToOmit.reduce(
    (mem, key) => ((k, { [k]: ignored, ...rest }) => rest)(key, mem),
    obj
  );

export const omitForEach = (obj, keys) => {
  const n = {};
  Object.keys(obj).forEach(key => {
    if (keys.includes(key)) {
      n[key] = obj[key];
    }
  });
  return n;
};

export const omitForInWithObject = (obj, keys) => {
  const keysArr = Array.isArray(keys) ? keys : [keys];
  const newObj = {};
  const keysArrObj = {};
  for (const key of keysArr) {
    keysArrObj[key] = true;
  }
  for (const key in obj) {
    if (!keysArrObj[key]) newObj[key] = obj[key];
  }
  return newObj;
};
export const _omitForInWithObject = (obj, keys) => {
  const keysArr = Array.isArray(keys) ? keys : [keys];
  const newObj = {};
  const keysArrObj = {};
  for (const key of keysArr) {
    keysArrObj[key] = true;
  }
  for (const key in obj) {
    if (!keysArrObj[key]) newObj[key] = obj[key];
  }
  return newObj;
};

export const omitBy = (obj, predicate) => {
  return Object.keys(obj)
    .filter(k => !predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

export const times = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

export const assetsTest = [
  {
    asset: {
      asset_code: '0xf8e386eda857484f5a12e4b5daa9984e06e73705',
      decimals: 18,
      icon_url:
        'https://s3.amazonaws.com/token-icons/0xf8e386eda857484f5a12e4b5daa9984e06e73705.png',
      id: '0xf8e386eda857484f5a12e4b5daa9984e06e73705',
      implementations: {
        ethereum: {
          address: '0xf8e386eda857484f5a12e4b5daa9984e06e73705',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Indorse',
      price: {
        changed_at: 0,
        relative_change_24h: -54.40357276949466,
        value: 0.002745763500000678,
      },
      symbol: 'IND',
      type: null,
    },
    circulating_supply: 44727651.23795287,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 122811.55220993113,
    subtitle: 'IND',
    tagline: null,
    tags: ['Token'],
    title: 'Indorse Token',
    total_supply: 170622046.99999997,
  },
  {
    asset: {
      asset_code: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6.png',
      id: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6',
      implementations: {
        ethereum: {
          address: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Raiden',
      price: {
        changed_at: 0,
        relative_change_24h: -54.13826860754103,
        value: 0.06633063570001638,
      },
      symbol: 'RDN',
      type: null,
    },
    circulating_supply: 51137365.57,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 3391973.9662822303,
    subtitle: 'RDNN',
    tagline: null,
    tags: ['Token'],
    title: 'Raiden Token',
    total_supply: 99999999,
  },
  {
    asset: {
      asset_code: '0xe0e05c43c097b0982db6c9d626c4eb9e95c3b9ce',
      decimals: 18,
      icon_url: null,
      id: '0xe0e05c43c097b0982db6c9d626c4eb9e95c3b9ce',
      implementations: {
        ethereum: {
          address: '0xe0e05c43c097b0982db6c9d626c4eb9e95c3b9ce',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Unslashed Finance',
      price: {
        changed_at: 0,
        relative_change_24h: -53.13145904659982,
        value: 0.05087257140001256,
      },
      symbol: 'USF',
      type: null,
    },
    circulating_supply: 21098293.7853403,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 1073324.4570131658,
    subtitle: 'USF',
    tagline: null,
    tags: ['Token'],
    title: 'Unslashed Finance Governance Token',
    total_supply: 86000000,
  },
  {
    asset: {
      asset_code: '0x69bbc3f8787d573f1bbdd0a5f40c7ba0aee9bcc9',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x69bbc3f8787d573f1bbdd0a5f40c7ba0aee9bcc9.png',
      id: '0x69bbc3f8787d573f1bbdd0a5f40c7ba0aee9bcc9',
      implementations: {
        ethereum: {
          address: '0x69bbc3f8787d573f1bbdd0a5f40c7ba0aee9bcc9',
          decimals: 18,
        },
        polygon: {
          address: '0x086373fad3447f7f86252fb59d56107e9e0faafa',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Yup',
      price: {
        changed_at: 0,
        relative_change_24h: -52.46557926268517,
        value: 0.012934298700003195,
      },
      symbol: 'YUP',
      type: null,
    },
    circulating_supply: 6400230.743925088,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 82782.49619087075,
    subtitle: 'YUP',
    tagline: null,
    tags: ['Token'],
    title: 'YUP',
    total_supply: 9315081,
  },
  {
    asset: {
      asset_code: '0x5c872500c00565505f3624ab435c222e558e9ff8',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x5c872500c00565505f3624ab435c222e558e9ff8.png',
      id: '0x5c872500c00565505f3624ab435c222e558e9ff8',
      implementations: {
        'binance-smart-chain': {
          address: '0x304fc73e86601a61a6c6db5b0eafea587622acdc',
          decimals: 18,
        },
        'ethereum': {
          address: '0x5c872500c00565505f3624ab435c222e558e9ff8',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'CoTrader',
      price: {
        changed_at: 0,
        relative_change_24h: -51.87678262037284,
        value: 0.000012813952470003165,
      },
      symbol: 'COT',
      type: null,
    },
    circulating_supply: 18886520618.311684,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 242010.97752678068,
    subtitle: 'COT',
    tagline: null,
    tags: ['Token'],
    title: 'CoTrader',
    total_supply: 20000000000,
  },
  {
    asset: {
      asset_code: '0x5caf454ba92e6f2c929df14667ee360ed9fd5b26',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x5caf454ba92e6f2c929df14667ee360ed9fd5b26.png',
      id: '0x5caf454ba92e6f2c929df14667ee360ed9fd5b26',
      implementations: {
        ethereum: {
          address: '0x5caf454ba92e6f2c929df14667ee360ed9fd5b26',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Dev Protocol',
      price: {
        changed_at: 0,
        relative_change_24h: -51.19178076132446,
        value: 0.21122515980005216,
      },
      symbol: 'DEV',
      type: null,
    },
    circulating_supply: 2142755.2272195052,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 452603.8152818371,
    subtitle: 'DEV',
    tagline: null,
    tags: ['Token'],
    title: 'Dev',
    total_supply: 9474108.99483035,
  },
  {
    asset: {
      asset_code: '0x3505f494c3f0fed0b594e01fa41dd3967645ca39',
      decimals: 18,
      icon_url: null,
      id: '0x3505f494c3f0fed0b594e01fa41dd3967645ca39',
      implementations: {
        ethereum: {
          address: '0x3505f494c3f0fed0b594e01fa41dd3967645ca39',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Swarm Network',
      price: {
        changed_at: 0,
        relative_change_24h: -48.622829146253956,
        value: 0.003844068900000949,
      },
      symbol: 'SWM',
      type: null,
    },
    circulating_supply: 78654617.65035424,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 302353.76955119247,
    subtitle: 'SWM',
    tagline: null,
    tags: ['Token'],
    title: 'SWARM',
    total_supply: 100000000,
  },
  {
    asset: {
      asset_code: '0x83cee9e086a77e492ee0bb93c2b0437ad6fdeccc',
      decimals: 18,
      icon_url:
        'https://s3.amazonaws.com/token-icons/0x83cee9e086a77e492ee0bb93c2b0437ad6fdeccc.png',
      id: '0x83cee9e086a77e492ee0bb93c2b0437ad6fdeccc',
      implementations: {
        ethereum: {
          address: '0x83cee9e086a77e492ee0bb93c2b0437ad6fdeccc',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Goldmint',
      price: {
        changed_at: 0,
        relative_change_24h: -46.21649672388573,
        value: 0.047624391600011765,
      },
      symbol: 'MNTP',
      type: null,
    },
    circulating_supply: 1800661.543042698,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 85755.41046494688,
    subtitle: 'MNTP',
    tagline: null,
    tags: ['Token'],
    title: 'Goldmint MNT Prelaunch Token',
    total_supply: 10000000,
  },
  {
    asset: {
      asset_code: '0xacbd826394189cf2623c6df98a18b41fc8ffc16d',
      decimals: 18,
      icon_url: null,
      id: '0xacbd826394189cf2623c6df98a18b41fc8ffc16d',
      implementations: {
        'binance-smart-chain': {
          address: '0x5989d72a559eb0192f2d20170a43a4bd28a1b174',
          decimals: 18,
        },
        'ethereum': {
          address: '0xacbd826394189cf2623c6df98a18b41fc8ffc16d',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'NFTify',
      price: {
        changed_at: 0,
        relative_change_24h: -43.36294690148434,
        value: 0.00798024030000197,
      },
      symbol: 'N1',
      type: null,
    },
    circulating_supply: 20362030.824556027,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 162493.89897600436,
    subtitle: 'N1',
    tagline: null,
    tags: [],
    title: 'NFTify',
    total_supply: 200000000,
  },
  {
    asset: {
      asset_code: '0x103c3a209da59d3e7c4a89307e66521e081cfdf0',
      decimals: 18,
      icon_url:
        'https://s3.amazonaws.com/token-icons/0x103c3a209da59d3e7c4a89307e66521e081cfdf0.png',
      id: '0x103c3a209da59d3e7c4a89307e66521e081cfdf0',
      implementations: {
        'binance-smart-chain': {
          address: '0xf25868b9e9c62f12192650ac668a2aa69f965f44',
          decimals: 18,
        },
        'ethereum': {
          address: '0x103c3a209da59d3e7c4a89307e66521e081cfdf0',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'Genesis Vision',
      price: {
        changed_at: 0,
        relative_change_24h: -42.27740089863405,
        value: 0.12214558140003016,
      },
      symbol: 'GVT',
      type: null,
    },
    circulating_supply: 4436644,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 541916.4608449554,
    subtitle: 'GVT',
    tagline: null,
    tags: ['Token'],
    title: 'Genesis Vision Token',
    total_supply: 4436644,
  },
  {
    asset: {
      asset_code: '0x10be9a8dae441d276a5027936c3aaded2d82bc15',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x10be9a8dae441d276a5027936c3aaded2d82bc15.png',
      id: '0x10be9a8dae441d276a5027936c3aaded2d82bc15',
      implementations: {
        ethereum: {
          address: '0x10be9a8dae441d276a5027936c3aaded2d82bc15',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'UniMex Network',
      price: {
        changed_at: 0,
        relative_change_24h: -42.067976367386215,
        value: 0.04361674530001077,
      },
      symbol: 'UMX',
      type: null,
    },
    circulating_supply: 7596152.204628037,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 331319.4359693764,
    subtitle: 'UMX',
    tagline: null,
    tags: ['Token'],
    title: 'https://unimex.network/',
    total_supply: 10000000,
  },
  {
    asset: {
      asset_code: '0x3c9d6c1c73b31c837832c72e04d3152f051fc1a9',
      decimals: 18,
      icon_url:
        'https://token-icons.s3.amazonaws.com/0x3c9d6c1c73b31c837832c72e04d3152f051fc1a9.png',
      id: '0x3c9d6c1c73b31c837832c72e04d3152f051fc1a9',
      implementations: {
        'binance-smart-chain': {
          address: '0x92d7756c60dcfd4c689290e8a9f4d263b3b32241',
          decimals: 18,
        },
        'ethereum': {
          address: '0x3c9d6c1c73b31c837832c72e04d3152f051fc1a9',
          decimals: 18,
        },
        'loopring': {
          address: '0x3c9d6c1c73b31c837832c72e04d3152f051fc1a9',
          decimals: 18,
        },
      },
      is_displayable: true,
      is_verified: true,
      name: 'BoringDAO  OLD',
      price: {
        changed_at: 0,
        relative_change_24h: -36.646075400613945,
        value: 106.32254086832626,
      },
      symbol: 'BOR',
      type: null,
    },
    circulating_supply: 105918.08180409779,
    explore_sections: [],
    gradient_color: { end: '#2962EF', start: '#001325' },
    market_cap: 11261479.581310911,
    subtitle: 'BOR',
    tagline: null,
    tags: ['Token'],
    title: 'BoringDAO',
    total_supply: 199999.99999999997,
  },
];

export const assetsTestTwice = [
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
  ...assetsTest,
];

export const assets = {
  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
    asset: {
      asset_code: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      coingecko_id: 'basic-attention-token',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x0d8775f648430679a709e98d2b0cb6250d2887ef.png',
      name: 'Basic Attention Token',
      price: {
        changed_at: -1,
        relative_change_24h: 9.023793077315462,
        value: 0.3211106067,
      },
      symbol: 'BAT',
      type: 'token',
    },
    quantity: '105360904068236264420',
  },
  '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': {
    asset: {
      asset_code: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
      coingecko_id: 'decentraland',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x0f5d2fb29fb7d3cfee444a200298f468908cc942.png',
      name: 'Decentraland MANA',
      price: {
        changed_at: -1,
        relative_change_24h: 7.972255590464258,
        value: 0.8357990095,
      },
      symbol: 'MANA',
      type: 'token',
    },
    quantity: '4445920000000000',
  },
  '0x23b608675a2b2fb1890d3abbd85c5775c51691d5': {
    asset: {
      asset_code: '0x23b608675a2b2fb1890d3abbd85c5775c51691d5',
      coingecko_id: 'unisocks',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x23b608675a2b2fb1890d3abbd85c5775c51691d5.png',
      name: 'Unisocks Edition 0',
      price: {
        changed_at: -1,
        relative_change_24h: 21.83108138402006,
        value: 13491.454188029998,
      },
      symbol: 'SOCKS',
      type: 'token',
    },
    quantity: '123989726317329',
  },
  '0x471c3a7f132bc94938516cb2bf6f02c7521d2797': {
    asset: {
      asset_code: '0x471c3a7f132bc94938516cb2bf6f02c7521d2797',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x471c3a7f132bc94938516cb2bf6f02c7521d2797.png',
      name: 'LUNA 2.0 (lunav2.io)',
      price: { changed_at: 1655372339808, relative_change_24h: 0, value: 0 },
      symbol: 'LUNA 2.0 (lunav2.io)',
      type: 'token',
    },
    quantity: '250457000000000000000000',
  },
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643': {
    asset: {
      asset_code: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
      coingecko_id: 'cdai',
      decimals: 8,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x5d3a536e4d6dbd6114cc1ead35777bab948e3643.png',
      name: 'Compound Dai',
      price: { changed_at: 1655372339808, relative_change_24h: 0, value: 0 },
      symbol: 'cDAI',
      type: 'token',
    },
    quantity: '9535023907',
  },
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    asset: {
      asset_code: '0x6b175474e89094c44da98b954eedeac495271d0f',
      coingecko_id: 'dai',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
      name: 'Dai Stablecoin',
      price: {
        changed_at: -1,
        relative_change_24h: -0.2470667444184739,
        value: 1.002742362607757,
      },
      symbol: 'DAI',
      type: 'token',
    },
    quantity: '60132834484318198268',
  },
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359': {
    asset: {
      asset_code: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
      coingecko_id: 'sai',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359.png',
      name: 'Sai Stablecoin',
      price: {
        changed_at: -1,
        relative_change_24h: 10.50439194556269,
        value: 6.009022071,
      },
      symbol: 'SAI',
      type: 'token',
    },
    quantity: '1383697977096967930',
  },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    asset: {
      asset_code: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      coingecko_id: 'usd-coin',
      decimals: 6,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      name: 'USD Coin',
      price: {
        changed_at: -1,
        relative_change_24h: 0.7483758595702543,
        value: 1.005690128529461,
      },
      symbol: 'USDC',
      type: 'token',
    },
    quantity: '22011655',
  },
  '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11': {
    asset: {
      asset_code: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xa478c2975ab1ea89e8196811f51a7b7ade33eb11.png',
      name: 'Uniswap V2',
      price: { changed_at: 1655372339808, relative_change_24h: 0, value: 0 },
      symbol: 'UNI-V2',
      type: 'token',
    },
    quantity: '65900997284241972',
  },
  '0xba100000625a3754423978a60c9317c58a424e3d': {
    asset: {
      asset_code: '0xba100000625a3754423978a60c9317c58a424e3d',
      coingecko_id: 'balancer',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xba100000625a3754423978a60c9317c58a424e3d.png',
      name: 'Balancer',
      price: {
        changed_at: -1,
        relative_change_24h: 7.17528788244913,
        value: 4.419345041205266,
      },
      symbol: 'BAL',
      type: 'token',
    },
    quantity: '5000000000000000000',
  },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    asset: {
      asset_code: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      coingecko_id: 'weth',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      name: 'Wrapped Ether',
      price: {
        changed_at: -1,
        relative_change_24h: 10.245509099083243,
        value: 1128.01,
      },
      symbol: 'WETH',
      type: 'token',
    },
    quantity: '1000000000000000',
  },
  '0xe41d2489571d322189246dafa5ebde1f4699f498': {
    asset: {
      asset_code: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      coingecko_id: '0x',
      decimals: 18,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xe41d2489571d322189246dafa5ebde1f4699f498.png',
      name: '0x Protocol Token',
      price: {
        changed_at: -1,
        relative_change_24h: 22.359263372046552,
        value: 0.2801751238,
      },
      symbol: 'ZRX',
      type: 'token',
    },
    quantity: '2843954429245378',
  },
  '0xf5dce57282a584d2746faf1593d3121fcac444dc': {
    asset: {
      asset_code: '0xf5dce57282a584d2746faf1593d3121fcac444dc',
      decimals: 8,
      icon_url:
        'https://logos.covalenthq.com/tokens/1/0xf5dce57282a584d2746faf1593d3121fcac444dc.png',
      name: 'Compound Dai',
      price: { changed_at: 1655372339808, relative_change_24h: 0, value: 0 },
      symbol: 'cDAI',
      type: 'token',
    },
    quantity: '1567683340',
  },
  'eth': {
    asset: {
      asset_code: 'eth',
      coingecko_id: 'ethereum',
      decimals: 18,
      icon_url:
        'https://www.covalenthq.com/static/images/icons/display-icons/ethereum-eth-logo.png',
      name: 'Ether',
      price: {
        changed_at: -1,
        relative_change_24h: 10.245509099083243,
        value: 1128.01,
      },
      symbol: 'ETH',
      type: 'token',
    },
    quantity: '574331469537000',
  },
};

const asset = {
  '0x0000000000000000000000000000000000000000_optimism': {
    asset: {
      asset_code: '0x0000000000000000000000000000000000000000',
      coingecko_id: 'ethereum',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
      mainnet_address: 'eth',
      name: 'Ether',
      network: 'optimism',
      price: {
        changed_at: 1582568575,
        relative_change_24h: -4.586615622469276,
        value: 259.2,
      },
      symbol: 'ETH',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x298B9B95708152ff6968aafd889c6586e9169f1D_optimism': {
    asset: {
      asset_code: '0x298B9B95708152ff6968aafd889c6586e9169f1D',
      coingecko_id: 'sbtc',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/SBTC.png',
      mainnet_address: '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6',
      name: 'Synthetic Bitcoin',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'sBTC',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6_optimism': {
    asset: {
      asset_code: '0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6',
      coingecko_id: 'chainlink',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/LINK.png',
      mainnet_address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      name: 'Chainlink',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'LINK',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x65559aa14915a70190438ef90104769e5e890a00_optimism': {
    asset: {
      asset_code: '0x65559aa14915a70190438ef90104769e5e890a00',
      coingecko_id: 'ethereum-name-service',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/LINK.png',
      mainnet_address: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
      name: 'Ethereum Name Service',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'ENS',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x68f180fcCe6836688e9084f035309E29Bf0A2095_optimism': {
    asset: {
      asset_code: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      coingecko_id: 'wrapped-bitcoin',
      decimals: 8,
      icon_url: 'https://s3.amazonaws.com/icons.assets/WBTC.png',
      mainnet_address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      name: 'Wrapped Bitcoin',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'WBTC',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x6fd9d7ad17242c41f7131d257212c54a0e816691_optimism': {
    asset: {
      asset_code: '0x6fd9d7ad17242c41f7131d257212c54a0e816691',
      coingecko_id: 'uniswap',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/UNI.png',
      mainnet_address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      name: 'Uniswap',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'UNI',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607_optimism': {
    asset: {
      asset_code: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      coingecko_id: 'usd-coin',
      decimals: 8,
      icon_url: 'https://s3.amazonaws.com/icons.assets/USDC.png',
      mainnet_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      name: 'USD Coin',
      network: 'optimism',
      price: { changed_at: 1582562452, relative_change_24h: 0.01, value: 1 },
      symbol: 'USD',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x7FB688CCf682d58f86D7e38e03f9D22e7705448B_optimism': {
    asset: {
      asset_code: '0x7FB688CCf682d58f86D7e38e03f9D22e7705448B',
      coingecko_id: 'rai',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/RAI.png',
      mainnet_address: '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919',
      name: 'Rai Reflex Index',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'RAI',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x8700daec35af8ff88c16bdf0418774cb3d7599b4_optimism': {
    asset: {
      asset_code: '0x8700daec35af8ff88c16bdf0418774cb3d7599b4',
      coingecko_id: 'havven',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/SNX.png',
      mainnet_address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      name: 'Synthetix',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'SNX',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9_optimism': {
    asset: {
      asset_code: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
      coingecko_id: 'susd',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/SUSD.png',
      mainnet_address: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
      name: 'Synthetic USD',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'sUSD',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58_optimism': {
    asset: {
      asset_code: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      coingecko_id: 'tether',
      decimals: 8,
      icon_url: 'https://s3.amazonaws.com/icons.assets/USDT.png',
      mainnet_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      name: 'Tether USD',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'USDT',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0x9bcef72be871e61ed4fbbc7630889bee758eb81d_optimism': {
    asset: {
      asset_code: '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
      coingecko_id: 'rocket-pool-eth',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/RETH.png',
      mainnet_address: '0xae78736cd615f374d3085123a210448e74fc6393',
      name: 'Rocket Pool ETH',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'rETH',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xb548f63d4405466b36c0c0ac3318a22fdcec711a_optimism': {
    asset: {
      asset_code: '0xb548f63d4405466b36c0c0ac3318a22fdcec711a',
      coingecko_id: 'rari-governance-token',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/RGT.png',
      mainnet_address: '0xd291e7a03283640fdc51b121ac401383a46cc623',
      name: 'Rari Governance Token',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'RGT',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819_optimism': {
    asset: {
      asset_code: '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819',
      coingecko_id: 'liquity-usd',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/LUSD.png',
      mainnet_address: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0',
      name: 'LUSD Stablecoin',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 19.13,
      },
      symbol: 'LUSD',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xc5Db22719A06418028A40A9B5E9A7c02959D0d08_optimism': {
    asset: {
      asset_code: '0xc5Db22719A06418028A40A9B5E9A7c02959D0d08',
      coingecko_id: 'slink',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/SLINK.png',
      mainnet_address: '0xbbc455cb4f1b9e4bfc4b73970d360c8f032efee6',
      name: 'Synthetic Chainlink',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'sLINK',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1_optimism': {
    asset: {
      asset_code: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      coingecko_id: 'dai',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/DAI_mcd.png',
      mainnet_address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      name: 'Dai',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'DAI',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xe0BB0D3DE8c10976511e5030cA403dBf4c25165B_optimism': {
    asset: {
      asset_code: '0xe0BB0D3DE8c10976511e5030cA403dBf4c25165B',
      coingecko_id: '0xbitcoin',
      decimals: 8,
      icon_url: 'https://ethereum-optimism.github.io/logos/0xBTC.png',
      mainnet_address: '0xb6ed7644c69416d67b522e20bc294a9a9b405b31',
      name: '0xBitcoin',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: '0xBTC',
      type: 'optimism',
    },
    quantity: 0,
  },
  '0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49_optimism': {
    asset: {
      asset_code: '0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49',
      coingecko_id: 'seth',
      decimals: 18,
      icon_url: 'https://s3.amazonaws.com/icons.assets/SETH.png',
      mainnet_address: '0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb',
      name: 'Synthetic Ether',
      network: 'optimism',
      price: {
        changed_at: 1582562452,
        relative_change_24h: 0.8470466197462612,
        value: 1,
      },
      symbol: 'sETH',
      type: 'optimism',
    },
    quantity: 0,
  },
};
