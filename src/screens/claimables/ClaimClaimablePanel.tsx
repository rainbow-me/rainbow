import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionClaimablePanel } from './components/TransactionClaimablePanel';
import { SponsoredClaimablePanel } from './components/SponsoredClaimablePanel';
import { RootStackParamList } from '@/navigation/types';
import { ClaimContextProvider } from './components/ClaimContext';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimClaimablePanel'>>();

  return (
    <ClaimContextProvider claimable={claimable}>
      {claimable.type === 'transaction' ? <TransactionClaimablePanel /> : <SponsoredClaimablePanel />}
    </ClaimContextProvider>
  );
};
