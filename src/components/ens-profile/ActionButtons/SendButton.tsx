import React, { useCallback } from 'react';
import ActionButton from './ActionButton';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';

export default function SendButton({ ensName }: { ensName?: string }) {
  const { navigate } = useNavigation();
  const handlePressSend = useCallback(async () => {
    if (IS_IOS) {
      navigate(Routes.SEND_FLOW, {
        params: {
          address: ensName,
          fromProfile: true,
        },
        screen: Routes.SEND_SHEET,
      });
    } else {
      navigate(Routes.SEND_FLOW, {
        address: ensName,
        fromProfile: true,
      });
    }
  }, [ensName, navigate]);

  return <ActionButton color="action (Deprecated)" icon="􀈠" onPress={handlePressSend} />;
}
