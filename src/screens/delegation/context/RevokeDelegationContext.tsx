import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigation } from '@/navigation';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import * as i18n from '@/languages';
import { globalColors } from '@/design-system';
import { RevokeReason, RevokeStatus, SheetContent } from '../types';
import { useRevokeGas } from './useRevokeGas';
import { useRevokeMutation } from './useRevokeMutation';

const LOCK_ACCENT_COLOR = '#b724ad';

const getSheetContent = (reason: RevokeReason, chainName?: string): SheetContent => {
  switch (reason) {
    // User-triggered
    case RevokeReason.DISABLE_SMART_WALLET:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_button),
        accentColor: LOCK_ACCENT_COLOR,
      };
    case RevokeReason.DISABLE_SINGLE_NETWORK:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_title, { network: chainName || '' }),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_button),
        accentColor: LOCK_ACCENT_COLOR,
      };
    case RevokeReason.DISABLE_THIRD_PARTY:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_button),
        accentColor: LOCK_ACCENT_COLOR,
      };
    // Backend-triggered
    case RevokeReason.ALERT_VULNERABILITY:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_button),
        accentColor: globalColors.red60,
      };
    case RevokeReason.ALERT_BUG:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_button),
        accentColor: globalColors.red60,
      };
    case RevokeReason.ALERT_UNRECOGNIZED:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_button),
        accentColor: LOCK_ACCENT_COLOR,
      };
    case RevokeReason.ALERT_UNSPECIFIED:
    default:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_button),
        accentColor: LOCK_ACCENT_COLOR,
      };
  }
};

type DelegationToRevoke = {
  chainId: number;
  contractAddress?: string;
};

type RevokeDelegationContextType = {
  revokeStatus: RevokeStatus;
  revokeReason: RevokeReason;
  sheetContent: SheetContent;
  currentDelegation: DelegationToRevoke;
  isLastDelegation: boolean;
  chainName: string;
  gasFeeDisplay: string | null;
  isCriticalBackendAlert: boolean;
  revoke: () => void;
  dismiss: () => void;
};

const RevokeDelegationContext = createContext<RevokeDelegationContextType | undefined>(undefined);

export function useRevokeDelegationContext() {
  const context = useContext(RevokeDelegationContext);
  if (context === undefined) {
    throw new Error('useRevokeDelegationContext must be used within a RevokeDelegationContextProvider');
  }
  return context;
}

export function RevokeDelegationContextProvider({
  delegationsToRevoke,
  onSuccess,
  revokeReason,
  children,
}: {
  delegationsToRevoke: DelegationToRevoke[];
  onSuccess?: () => void;
  revokeReason: RevokeReason;
  children: React.ReactNode;
}) {
  const { goBack } = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('notReady');
  const accountAddress = useWalletsStore(state => state.accountAddress);
  const getChainsLabel = useBackendNetworksStore(state => state.getChainsLabel);

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;
  const chainId = currentDelegation?.chainId as ChainId;

  const chainsLabel = getChainsLabel();
  const chainName = chainId ? chainsLabel[chainId] || `Chain ${chainId}` : '';

  const isCriticalBackendAlert = revokeReason === RevokeReason.ALERT_VULNERABILITY || revokeReason === RevokeReason.ALERT_BUG;

  const { gasFeeDisplay } = useRevokeGas(chainId, revokeStatus, setRevokeStatus);
  const sheetContent = getSheetContent(revokeReason, chainName);

  const { revoke } = useRevokeMutation({
    currentDelegation,
    accountAddress,
    isLastDelegation,
    goBack,
    onSuccess,
    setRevokeStatus,
    setCurrentIndex,
  });

  const dismiss = useCallback(() => {
    goBack();
  }, [goBack]);

  const value = useMemo(
    () => ({
      revokeStatus,
      revokeReason,
      sheetContent,
      currentDelegation,
      isLastDelegation,
      chainName,
      gasFeeDisplay,
      isCriticalBackendAlert,
      revoke,
      dismiss,
    }),
    [
      revokeStatus,
      revokeReason,
      sheetContent,
      currentDelegation,
      isLastDelegation,
      chainName,
      gasFeeDisplay,
      isCriticalBackendAlert,
      revoke,
      dismiss,
    ]
  );

  return <RevokeDelegationContext.Provider value={value}>{children}</RevokeDelegationContext.Provider>;
}
