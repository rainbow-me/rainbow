import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionClaimableFlow } from './transaction/components/TransactionClaimableFlow';
import { SponsoredClaimableFlow } from './sponsored/components/SponsoredClaimableFlow';
import { RootStackParamList } from '@/navigation/types';
import { TransactionClaimableContextProvider } from './transaction/context/TransactionClaimableContext';
import { SponsoredClaimableContextProvider } from './sponsored/context/SponsoredClaimableContext';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimClaimablePanel'>>();

  switch (claimable.type) {
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
