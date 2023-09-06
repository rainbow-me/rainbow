import * as i18n from '@/languages';

export default {
  mainnet: [
    {
      emoji: 'fire',
      id: 'trending',
      name: i18n.t(i18n.l.discover.lists.types.trending),
      tokens: [],
    },
    {
      emoji: 'television',
      id: 'watchlist',
      name: i18n.t(i18n.l.discover.lists.types.watchlist),
      tokens: [],
    },
    {
      emoji: 'star',
      id: 'favorites',
      name: i18n.t(i18n.l.discover.lists.types.favorites),
      tokens: [],
    },
    {
      emoji: 'roller_coaster',
      id: 'defi',
      name: i18n.t(i18n.l.discover.lists.types.defi),
      tokens: [
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
        '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
        '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
        '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
        '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
        '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd', // LRCv2
        '0x408e41876cccdc0f92210600ef50372656052a38', // REN
        '0xba100000625a3754423978a60c9317c58a424e3d', // BAL
        '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', // KNC
      ],
    },
    {
      emoji: 'dollar_banknote',
      id: 'stablecoins',
      name: i18n.t(i18n.l.discover.lists.types.stablecoins),
      tokens: [
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
        '0x4fabb145d64652a948d72533023f6e7a623c7c53', // BUSD
        '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // SUSD
        '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // GUSD
        '0xdb25f211ab05b1c97d595516f45794528a807ad8', // EURS
      ],
    },
  ],
};
