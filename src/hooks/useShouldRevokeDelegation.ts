import { useEffect } from 'react';

import { useIsDelegationEnabled } from '@/features/delegation/featureFlags';
import { EthereumWalletType } from '@/helpers/walletTypes';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RevokeReason } from '@/screens/delegation/RevokeDelegationPanel';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { delegation } from '@rainbow-me/delegation';

export function useShouldRevokeDelegation() {
  const delegationEnabled = useIsDelegationEnabled();
  const { accountAddress, walletType } = useWalletsStore(state => ({
    accountAddress: state.accountAddress,
    walletType: state.selected?.type,
  }));

  useEffect(() => {
    // Hardware wallets are not supported for delegation
    if (!accountAddress || walletType === EthereumWalletType.readOnly || walletType === EthereumWalletType.bluetooth) return;

    if (!delegationEnabled) return;

    const check = async () => {
      const result = await delegation.shouldRevoke({ address: accountAddress });

      if (result.shouldRevoke && result.revokes.length > 0) {
        Navigation.handleAction(Routes.REVOKE_DELEGATION_PANEL, {
          address: accountAddress,
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
  }, [accountAddress, delegationEnabled, walletType]);
}
