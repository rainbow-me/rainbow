import { globalColors } from '@/design-system';

type LearnCategory =
  | 'Essentials'
  | 'Staying Safe'
  | 'How to use Rainbow'
  | "Beginner's Guides"
  | 'Blockchains and Fees'
  | 'What is Web3?';

type CardColor =
  | 'pink'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'darkGreen'
  | 'darkBlue';

// enum LearnCategories {
//   Essentials = 'Essentials',
//   Safety = 'Staying Safe',
//   Guides = "Beginner's Guides",
//   Web3 = 'What is Web3?',
//   Blockchains = 'Blockchains and Fees',
//   HowTo = 'How to use Rainbow',
//   HowToDark = 'How to use Rainbow',
// }

export interface LearnCardDetails {
  url: string;
  category: LearnCategory;
  title: string;
  emoji: string;
  description: string;
}

export interface CardColorway {
  gradient: string[];
  shadowColor: string;
  orbColorLight: string;
  orbColorDark: string;
  primaryTextColor: string;
  secondaryTextColor: string;
}

export const cardColorways: (
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
      orbColorDark: globalColors.purple70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.purple20,
    },
    pink: {
      gradient: isDarkMode
        ? [globalColors.pink70, globalColors.pink60]
        : [globalColors.pink60, '#FF70B3'],
      shadowColor: globalColors.pink60,
      orbColorLight: globalColors.pink20,
      orbColorDark: globalColors.pink70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.pink20,
    },
    blue: {
      gradient: isDarkMode
        ? [globalColors.blue70, globalColors.blue60]
        : [globalColors.blue60, '#268FFF'],
      shadowColor: globalColors.blue60,
      orbColorLight: globalColors.blue20,
      orbColorDark: globalColors.blue70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.blue20,
    },
    darkBlue: {
      gradient: isDarkMode
        ? [globalColors.blue100, globalColors.blue90]
        : [globalColors.blue90, globalColors.blue80],
      shadowColor: globalColors.blue90,
      orbColorLight: globalColors.blue20,
      orbColorDark: globalColors.blue100,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.blue20,
    },
    yellow: {
      gradient: isDarkMode
        ? [globalColors.yellow70, '#FFCB0F']
        : ['#FFCB0F', '#FFDA24'],
      shadowColor: '#FFCB0F',
      orbColorLight: globalColors.yellow20,
      orbColorDark: globalColors.yellow70,
      primaryTextColor: globalColors.orange100,
      secondaryTextColor: globalColors.yellow90,
    },
    green: {
      gradient: isDarkMode
        ? [globalColors.green70, globalColors.green60]
        : [globalColors.green60, '#3ECF5B'],
      shadowColor: globalColors.green60,
      orbColorLight: globalColors.green20,
      orbColorDark: globalColors.green70,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.green20,
    },
    darkGreen: {
      gradient: isDarkMode
        ? [globalColors.green100, globalColors.green90]
        : [globalColors.green90, globalColors.green80],
      shadowColor: globalColors.green90,
      orbColorLight: globalColors.green20,
      orbColorDark: globalColors.green100,
      primaryTextColor: globalColors.white100,
      secondaryTextColor: globalColors.green20,
    },
  };
};

export const learnCategoryColors: (
  isDarkMode: boolean
) => {
  [key in LearnCategory]: CardColorway;
} = (isDarkMode: boolean) => {
  const themedCardColorways = cardColorways(isDarkMode);
  return {
    'Essentials': themedCardColorways.purple,
    'Staying Safe': themedCardColorways.pink,
    'How to use Rainbow': themedCardColorways.blue,
    // 'How to use Rainbow 2': cardColorways.darkBlue,
    "Beginner's Guides": themedCardColorways.yellow,
    'What is Web3?': themedCardColorways.green,
    'Blockchains and Fees': themedCardColorways.darkGreen,
  };
};

const getStartedCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/get-started-with-rainbow',
  category: 'Essentials',
  title: 'Get Started with Rainbow',
  emoji: '🌈',
  description:
    "Welcome to Rainbow! We're so glad you're here. Weve created this guide to help with the basics of Rainbow and get you started on your new Web3 and Ethereum journey.",
};

const backupsCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/the-importance-of-backups',
  category: 'Essentials',
  title: 'The Importance of Backups',
  emoji: '☮️',
  description:
    'Keeping your wallet safe, secure, and backed up is essential to wallet ownership. Here we’ll chat about why it’s important to backup your wallet and the different methods that you can backup with.',
};

const protectWalletCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/protect-your-wallet',
  category: 'Staying Safe',
  title: 'Protect Your Wallet',
  emoji: '🔒',
  description:
    'One of the best parts of having an Ethereum wallet like Rainbow is that you are in total control of your money. Unlike a bank account from Wells Fargo or a crypto exchange like Coinbase, we do not hold your assets on your behalf.',
};

const connectToDappCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/connect-to-a-website-or-app',
  category: 'Essentials',
  title: 'Connect to a Website or App',
  emoji: '🔌',
  description:
    "Now that you have an Ethereum wallet, you can login to certain websites using it. Instead of creating new accounts and passwords for every website you interact with, you'll just connect your wallet instead.",
};

const avoidScamsCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/avoid-crypto-scams',
  category: 'Staying Safe',
  title: 'Avoid Crypto Scams',
  emoji: '🤬',
  description:
    "Here at Rainbow, one of our goals is to make exploring the new world of Ethereum fun, friendly, and safe. You know what's not any of those things? Scams. They're mean, and no one likes them. We want to help you avoid them, so we wrote this brief guide to help you do exactly that!",
};

export const learnCards: LearnCardDetails[] = [
  getStartedCard,
  backupsCard,
  protectWalletCard,
  connectToDappCard,
  avoidScamsCard,
];
