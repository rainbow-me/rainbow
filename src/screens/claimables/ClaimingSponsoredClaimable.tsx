import React, { useState } from 'react';
import { SponsoredClaimable } from '@/resources/addys/claimables/types';
import { ClaimingClaimableSharedUI, ClaimStatus } from './ClaimingClaimableSharedUI';

export const ClaimingSponsoredClaimable = ({ claimable }: { claimable: SponsoredClaimable }) => {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');

  return <ClaimingClaimableSharedUI claim={() => {}} claimable={claimable} claimStatus={claimStatus} setClaimStatus={setClaimStatus} />;
};
