import React, { useCallback, useEffect, useState } from 'react';
import { useAndroidBackHandler } from 'react-navigation-backhandler';

import styled from '@/styled-thing';
import { fonts, position } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { SheetActionButton, SheetTitle } from '@/components/sheet';
import { isAuthenticated } from '@/utils/authentication';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { checkKeychainIntegrity } from '@/redux/wallets';
import store from '@/redux/store';

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.alpha(colors.white, 0.9),
  justifyContent: 'center',
});

export default function CheckIdentifierScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'CheckIdentifierScreen'>>();

  const { onSuccess, onFailure } = params;

  const [isChecking, setIsChecking] = useState(false);

  useAndroidBackHandler(() => {
    return true;
  });

  const initAndRunKeychainChecks = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const authenticated = await isAuthenticated();
      console.log({ authenticated });
      if (!authenticated) return;

      // TODO: what causes an unhealthy wallet?

      // TODO: Do some checklist animations here while we're checking integrity?
      const isHealthy = await store.dispatch(checkKeychainIntegrity());
      if (isHealthy) return onSuccess();

      onFailure();
    } catch (err) {
      // TODO: Log info here and display alert
    }
  }, [isChecking, onSuccess, onFailure]);

  useEffect(() => {
    setTimeout(initAndRunKeychainChecks, 1000);
  }, [initAndRunKeychainChecks, isChecking]);

  return (
    <Container testID="check-identifier-screen">
      <SheetTitle align="center" lineHeight="big" size={fonts.size.big} weight="heavy">
        We have detected an reinstall or phone migration. Please authenticate to continue.
      </SheetTitle>

      <SheetActionButton label="Authenticate" onPress={initAndRunKeychainChecks} testID="check-identifier-screen-action-button" />
    </Container>
  );
}
