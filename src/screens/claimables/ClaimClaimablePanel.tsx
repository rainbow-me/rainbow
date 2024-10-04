import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ClaimingTransactionClaimable } from './ClaimingTransactionClaimable';
import { ClaimingSponsoredClaimable } from './ClaimingSponsoredClaimable';
import { RootStackParamList } from '@/navigation/types';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimClaimablePanel'>>();

  return claimable.type === 'transaction' ? (
    <ClaimingTransactionClaimable claimable={claimable} />
  ) : (
    <ClaimingSponsoredClaimable claimable={claimable} />
  );
};
