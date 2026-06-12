import React from 'react';

import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import useAccountSettings from '@/hooks/useAccountSettings';
import useIsOffline from '@/hooks/useIsOffline';
import * as i18n from '@/languages';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import Toast from './Toast';

const OfflineToast = () => {
  const isOffline = useIsOffline({ debounceMs: time.seconds(0.5) });
  const { chainId } = useAccountSettings();
  const connectedToAnvil = useConnectedToAnvilStore(state => state.connectedToAnvil);
  const isMainnet = chainId === ChainId.mainnet && !connectedToAnvil;
  return <Toast icon="offline" isVisible={isOffline && isMainnet} text={i18n.t(i18n.l.button.offline)} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
