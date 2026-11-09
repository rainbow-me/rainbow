import React from 'react';

import { time } from '@/framework/core/utils/time';
import useIsOffline from '@/hooks/useIsOffline';
import * as i18n from '@/languages';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import Toast from './Toast';

const OfflineToast = () => {
  const isOffline = useIsOffline({ debounceMs: time.seconds(0.5) });
  const connectedToAnvil = useConnectedToAnvilStore(state => state.connectedToAnvil);
  return <Toast icon="offline" isVisible={isOffline && !connectedToAnvil} text={i18n.t(i18n.l.button.offline)} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
