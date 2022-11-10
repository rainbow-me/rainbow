export enum LearnCategory {
  Essentials = 'essentials',
  Safety = 'safety',
  Rainbow = 'rainbow',
  BeginnersGuides = 'beginners_guides',
  Blockchains = 'blockchains',
  Web3 = 'web3',
}

export type LearnCardKey =
  | 'get_started'
  | 'backups'
  | 'protect_wallet'
  | 'connect_to_dapp'
  | 'avoid_scams'
  | 'crypto_and_wallets';

export type CardColor =
  | 'pink'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'darkGreen'
  | 'darkBlue';

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
