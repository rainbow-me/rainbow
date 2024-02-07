export enum LearnCategory {
  Essentials = 'essentials',
  StayingSafe = 'staying_safe',
  BeginnersGuides = 'beginners_guides',
  BlockchainsAndFees = 'blockchains_and_fees',
  WhatIsWeb3 = 'what_is_web3',
  AppsAndConnections = 'apps_and_connections',
  NavigatingYourWallet = 'navigating_your_wallet',
}

export type LearnCardKey =
  | 'get_started'
  | 'backups'
  | 'protect_wallet'
  | 'connect_to_dapp'
  | 'avoid_scams'
  | 'crypto_and_wallets'
  | 'understanding_web3'
  | 'manage_connections'
  | 'supported_networks'
  | 'collect_nfts';

export type CardColor = 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'darkGreen' | 'darkBlue';

export type LearnCardDetails = {
  url: string;
  category: LearnCategory;
  emoji: string;
  key: LearnCardKey;
};

export type CardColorway = {
  gradient: string[];
  shadowColor: string;
  orbColorLight: string;
  orbColorDark: string;
  primaryTextColor: string;
  secondaryTextColor: string;
};
