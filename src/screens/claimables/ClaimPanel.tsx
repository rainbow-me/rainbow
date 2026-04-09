import React from 'react';

import { useRoute, type RouteProp } from '@react-navigation/native';

import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

import { SponsoredClaimableFlow } from './sponsored/components/SponsoredClaimableFlow';
import { SponsoredClaimableContextProvider } from './sponsored/context/SponsoredClaimableContext';
import { TransactionClaimableFlow } from './transaction/components/TransactionClaimableFlow';
import { TransactionClaimableContextProvider } from './transaction/context/TransactionClaimableContext';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.CLAIM_CLAIMABLE_PANEL>>();

  switch (claimable.actionType) {
    case 'multi_transaction':
    case 'transaction':
      return (
        <TransactionClaimableContextProvider claimable={claimable}>
          <TransactionClaimableFlow />
        </TransactionClaimableContextProvider>
      );
    case 'sponsored':
      return (
        <SponsoredClaimableContextProvider claimable={claimable}>
          <SponsoredClaimableFlow />
        </SponsoredClaimableContextProvider>
      );
    default:
      return null;
  }
};
