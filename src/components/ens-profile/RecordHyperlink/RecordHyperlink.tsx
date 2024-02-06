import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import Routes from '@/navigation/routesNames';

const ENS_REGEX = /[^\s]+.eth/g;

export default function RecordHyperlink({ value }: { value: string }) {
  const { goBack, navigate } = useNavigation();

  const navigateToProfile = useCallback(() => {
    if (value.match(ENS_REGEX)) {
      goBack();
      navigate(Routes.PROFILE_SHEET, {
        address: value,
        fromRoute: 'RecordHyperlink',
      });
    } else {
      Linking.openURL((value.match('https') ? '' : 'https://') + value);
    }
  }, [navigate, value, goBack]);

  return (
    <ButtonPressAnimation onPress={navigateToProfile}>
      <Text color="action (Deprecated)" size="16px / 22px (Deprecated)" weight="regular">
        {value}
      </Text>
    </ButtonPressAnimation>
  );
}
