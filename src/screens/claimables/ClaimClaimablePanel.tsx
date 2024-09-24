import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Claimable } from '@/resources/addys/claimables/types';
import { ClaimingTransactionClaimable } from './ClaimingTransactionClaimable';
import { ClaimingSponsoredClaimable } from './ClaimingSponsoredClaimable';

type RouteParams = {
  ClaimClaimablePanelParams: { claimable: Claimable };
};

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RouteParams, 'ClaimClaimablePanelParams'>>();

  return claimable.type === 'transaction' ? (
    <ClaimingTransactionClaimable claimable={claimable} />
  ) : (
    <ClaimingSponsoredClaimable claimable={claimable} />
  );
};
