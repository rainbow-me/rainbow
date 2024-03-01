import { delay } from '@/helpers/utilities';
import React, { useReducer } from 'react';
import { LearnCard } from './LearnCard';
import {
  avoidScamsCard,
  backupsCard,
  collectNFTsCard,
  connectToDappCard,
  getStartedCard,
  manageConnectionsCard,
  protectWalletCard,
  supportedNetworksCard,
  web3Card,
} from './utils/constants';
import { LearnCardDetails } from './utils/types';

export const LEARN_CARD_HEIGHT = 185;

const learnCards: LearnCardDetails[] = [
  getStartedCard,
  backupsCard,
  connectToDappCard,
  web3Card,
  protectWalletCard,
  avoidScamsCard,
  manageConnectionsCard,
  supportedNetworksCard,
  collectNFTsCard,
];

export const RotatingLearnCard = () => {
  const [index, incrementIndex] = useReducer(i => (i === learnCards.length - 1 ? 0 : i + 1), 0);

  return <LearnCard type="stretch" rotate={() => delay(300).then(incrementIndex)} cardDetails={learnCards[index]} />;
};
