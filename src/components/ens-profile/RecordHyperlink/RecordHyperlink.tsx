import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useOpenInBrowser } from '@/hooks/useOpenInBrowser';

const ENS_REGEX = /[^\s]+.eth/g;

export default function RecordHyperlink({ value }: { value: string }) {
  const { goBack, navigate } = useNavigation();
  const openInBrowser = useOpenInBrowser();

  const navigateToProfile = useCallback(() => {
    if (value.match(ENS_REGEX)) {
      goBack();
      navigate(Routes.PROFILE_SHEET, {
        address: value,
        fromRoute: 'RecordHyperlink',
      });
    } else {
      openInBrowser((value.match('https') ? '' : 'https://') + value);
    }
  }, [value, goBack, navigate, openInBrowser]);

  return (
    <ButtonPressAnimation onPress={navigateToProfile}>
      <Text color="action (Deprecated)" size="16px / 22px (Deprecated)" weight="regular">
        {value}
      </Text>
    </ButtonPressAnimation>
  );
}
