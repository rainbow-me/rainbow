import { globalColors } from '@/design-system';
import {
  CardColor,
  CardColorway,
  LearnCardDetails,
  LearnCategory,
} from './types';

export const getCardColorways: (
  isDarkMode: boolean
) => {
  [key in CardColor]: CardColorway;
} = (isDarkMode: boolean) => {
  return {
    purple: {
      gradient: isDarkMode
        ? [globalColors.purple70, globalColors.purple60]
        : [globalColors.purple60, '#9585FF'],
      shadowColor: globalColors.purple60,
      orbColorLight: globalColors.purple20,
      orbColorDark: isDarkMode ? globalColors.purple80 : globalColors.purple70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.purple20,
    },
    pink: {
      gradient: isDarkMode
        ? [globalColors.pink70, globalColors.pink60]
        : [globalColors.pink60, '#FF70B3'],
      shadowColor: globalColors.pink60,
      orbColorLight: globalColors.pink20,
      orbColorDark: isDarkMode ? globalColors.pink80 : globalColors.pink70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.pink20,
    },
    blue: {
      gradient: isDarkMode
        ? [globalColors.blue70, globalColors.blue60]
        : [globalColors.blue60, '#268FFF'],
      shadowColor: globalColors.blue60,
      orbColorLight: globalColors.blue20,
      orbColorDark: isDarkMode ? globalColors.blue80 : globalColors.blue70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.blue20,
    },
    darkBlue: {
      gradient: isDarkMode
        ? [globalColors.blue100, globalColors.blue90]
        : [globalColors.blue90, globalColors.blue80],
      shadowColor: globalColors.blue90,
      orbColorLight: globalColors.blue20,
      orbColorDark: isDarkMode ? globalColors.blue80 : globalColors.blue70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.blue20,
    },
    yellow: {
      gradient: isDarkMode
        ? [globalColors.yellow70, '#FFCB0F']
        : ['#FFCB0F', '#FFDA24'],
      shadowColor: '#FFCB0F',
      orbColorLight: globalColors.yellow20,
      orbColorDark: isDarkMode ? globalColors.yellow80 : globalColors.yellow70,
      primaryTextColor: globalColors.orange100,
      secondaryTextColor: globalColors.yellow90,
    },
    green: {
      gradient: isDarkMode
        ? [globalColors.green70, globalColors.green60]
        : [globalColors.green60, '#3ECF5B'],
      shadowColor: globalColors.green60,
      orbColorLight: globalColors.green20,
      orbColorDark: isDarkMode ? globalColors.green80 : globalColors.green70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.green20,
    },
    darkGreen: {
      gradient: isDarkMode
        ? [globalColors.green100, globalColors.green90]
        : [globalColors.green90, globalColors.green80],
      shadowColor: globalColors.green90,
      orbColorLight: globalColors.green20,
      orbColorDark: isDarkMode ? globalColors.green80 : globalColors.green70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.green20,
    },
  };
};

export const getLearnCardColorway: (
  category: LearnCategory,
  isDarkMode: boolean
) => CardColorway = (category: LearnCategory, isDarkMode: boolean) => {
  const colorways = getCardColorways(isDarkMode);
  switch (category) {
    case LearnCategory.Essentials:
      return colorways.purple;
    case LearnCategory.Safety:
      return colorways.pink;
    case LearnCategory.Rainbow:
      return colorways.blue;
    case LearnCategory.BeginnersGuides:
      return colorways.yellow;
    case LearnCategory.Blockchains:
      return colorways.darkGreen;
    case LearnCategory.Web3:
      return colorways.green;
    default:
      return colorways.darkBlue;
  }
};

export const getStartedCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/get-started-with-rainbow',
  category: LearnCategory.Essentials,
  key: 'get_started',
  emoji: '🌈',
};

export const backupsCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/the-importance-of-backups',
  category: LearnCategory.Essentials,
  key: 'backups',
  emoji: '☮️',
};

export const protectWalletCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/protect-your-wallet',
  category: LearnCategory.Safety,
  key: 'protect_wallet',
  emoji: '🔒',
};

export const connectToDappCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/connect-to-a-website-or-app',
  category: LearnCategory.Essentials,
  key: 'connect_to_dapp',
  emoji: '🔌',
};

export const avoidScamsCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/avoid-crypto-scams',
  category: LearnCategory.Safety,
  key: 'avoid_scams',
  emoji: '🤬',
};

export const cryptoAndWalletsCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/crypto-and-wallets',
  category: LearnCategory.BeginnersGuides,
  key: 'crypto_and_wallets',
  emoji: '🤔',
};

export const learnCards: LearnCardDetails[] = [
  getStartedCard,
  backupsCard,
  protectWalletCard,
  connectToDappCard,
  avoidScamsCard,
];
