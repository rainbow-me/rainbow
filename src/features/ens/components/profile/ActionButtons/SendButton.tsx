import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import ActionButton from './ActionButton';

export default function SendButton({ ensName }: { ensName?: string }) {
  const { navigate } = useNavigation();
  const handlePressSend = useCallback(async () => {
    if (Platform.OS === 'ios') {
      navigate(Routes.SEND_FLOW, {
        screen: Routes.SEND_SHEET,
        params: {
          address: ensName,
          fromProfile: true,
        },
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
