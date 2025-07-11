import React, { useCallback } from 'react';
import ActionButton from './ActionButton';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';

export default function SendButton({ ensName }: { ensName?: string }) {
  const handlePressSend = useCallback(async () => {
    if (IS_IOS) {
      Navigation.handleAction(Routes.SEND_FLOW, {
        screen: Routes.SEND_SHEET,
        params: {
          address: ensName,
          fromProfile: true,
        },
      });
    } else {
      Navigation.handleAction(Routes.SEND_FLOW, {
        address: ensName,
        fromProfile: true,
      });
    }
  }, [ensName]);

  return <ActionButton color="action (Deprecated)" icon="􀈠" onPress={handlePressSend} />;
}
