import React, { useCallback } from 'react';
import ActionButton from './ActionButton';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function SendButton({ ensName }: { ensName?: string }) {
  const { navigate } = useNavigation();
  const handlePressSend = useCallback(async () => {
    if (isNativeStackAvailable || android) {
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

  return <ActionButton color="action" icon="􀈠" onPress={handlePressSend} />;
}
