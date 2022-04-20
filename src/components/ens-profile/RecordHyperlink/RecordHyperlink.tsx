import { useNavigation } from '@react-navigation/core';
import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export default function RecordHyperlink({ value }: { value: string }) {
  const { goBack, navigate } = useNavigation();

  const navigateToProfile = useCallback(() => {
    goBack();
    navigate(Routes.PROFILE_SHEET, { address: value });
  }, [navigate, value, goBack]);

  return (
    <ButtonPressAnimation onPress={navigateToProfile}>
      <Text color="action" size="16px" weight="bold">
        {value}
      </Text>
    </ButtonPressAnimation>
  );
}
