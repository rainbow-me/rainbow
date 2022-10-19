import { globalColors } from '@/design-system';

type LearnCategory =
  | 'Essentials'
  | 'Staying Safe'
  | 'How to use Rainbow'
  | "Beginner's Guides"
  | 'Blockchains and Fees'
  | 'What is Web3?';

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

interface LearnCategoryColorway {
  gradient: string[];
  primaryColor: string;
  secondaryColor: string;
}

export const learnCategoryColors: {
  [key in LearnCategory]: LearnCategoryColorway;
} = {
  'Essentials': {
    gradient: [globalColors.purple60, '#9585FF'],
    primaryColor: globalColors.purple60,
    secondaryColor: globalColors.purple20,
  },
  'Staying Safe': {
    gradient: [globalColors.pink60, '#FF70B3'],
    primaryColor: globalColors.pink60,
    secondaryColor: globalColors.pink20,
  },
  'How to use Rainbow': {
    gradient: [globalColors.blue60, '#268FFF'],
    primaryColor: globalColors.blue60,
    secondaryColor: globalColors.blue20,
  },
  // 'How to use Rainbow 2': {
  //   gradient: [globalColors.blue90, globalColors.blue80],
  //   primaryColor: globalColors.blue90,
  //   secondaryColor: globalColors.blue20,
  // },
  "Beginner's Guides": {
    gradient: ['#FFCB0F', '#FFDA24'],
    primaryColor: '#FFCB0F',
    secondaryColor: globalColors.yellow20,
  },
  'What is Web3?': {
    gradient: [globalColors.green60, '#3ECF5B'],
    primaryColor: globalColors.green60,
    secondaryColor: globalColors.green20,
  },
  'Blockchains and Fees': {
    gradient: [globalColors.green90, globalColors.green80],
    primaryColor: globalColors.green90,
    secondaryColor: globalColors.green20,
  },
};

const getStartedCard: LearnCardDetails = {
  url: 'https://learn.rainbow.me/get-started-with-rainbow',
  category: 'Essentials',
  title: 'Get Started with Rainbow',
  emoji: '🌈',
  description:
    "Welcome to Rainbow! We're so glad you're here. Weve created this guide to help with the basics of Rainbow and get you started on your new Web3 and Ethereum journey.",
};

// const backupsCard: LearnCard = {
//   url:,
//   category:,
//   title:,
//   emoji:,
//   description:
// }

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
