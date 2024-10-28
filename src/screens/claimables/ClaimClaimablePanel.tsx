import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionClaimablePanel } from './components/TransactionClaimablePanel';
import { SponsoredClaimablePanel } from './components/SponsoredClaimablePanel';
import { RootStackParamList } from '@/navigation/types';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimClaimablePanel'>>();

  return claimable.type === 'transaction' ? (
    <TransactionClaimablePanel claimable={claimable} />
  ) : (
    <SponsoredClaimablePanel claimable={claimable} />
  );
};
