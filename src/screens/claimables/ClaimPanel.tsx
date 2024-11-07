import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionClaimableFlow } from './transaction/components/TransactionClaimableFlow';
import { SponsoredClaimableFlow } from './sponsored/components/SponsoredClaimableFlow';
import { RootStackParamList } from '@/navigation/types';
import { TransactionClaimableContextProvider } from './transaction/context/TransactionClaimableContext';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimClaimablePanel'>>();

  return claimable.type === 'transaction' ? (
    <TransactionClaimableContextProvider claimable={claimable}>
      <TransactionClaimableFlow />
    </TransactionClaimableContextProvider>
  ) : (
    <SponsoredClaimableFlow />
  );
};
