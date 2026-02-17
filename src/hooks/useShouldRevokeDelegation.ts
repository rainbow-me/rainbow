import { useEffect } from 'react';
import { shouldRevokeDelegation } from '@rainbow-me/delegation';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RevokeReason } from '@/screens/delegation/RevokeDelegationPanel';
import { DELEGATION, getExperimentalFlag } from '@/config';
import { getRemoteConfig } from '@/model/remoteConfig';
import type { Address } from 'viem';

export function useShouldRevokeDelegation() {
  const accountAddress = useWalletsStore(state => state.accountAddress);

  useEffect(() => {
    if (!accountAddress) return;

    const delegationEnabled = getRemoteConfig().delegation_enabled || getExperimentalFlag(DELEGATION);
    if (!delegationEnabled) return;

    const check = async () => {
      const result = await shouldRevokeDelegation({ address: accountAddress as Address });

      if (result.shouldRevoke && result.revokes.length > 0) {
        Navigation.handleAction(Routes.REVOKE_DELEGATION_PANEL, {
          delegationsToRevoke: result.revokes.map(r => ({
            chainId: r.chainId,
            contractAddress: r.address,
          })),
          // TODO: map per-revoke reason once shouldRevokeDelegation() exposes revokeReason per Revoke entry
          revokeReason: RevokeReason.ALERT_UNSPECIFIED,
        });
      }
    };

    check();
  }, [accountAddress]);
}
