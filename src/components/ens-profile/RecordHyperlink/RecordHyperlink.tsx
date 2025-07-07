import { Navigation } from '@/navigation';
import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { openInBrowser } from '@/utils/openInBrowser';

const ENS_REGEX = /[^\s]+.eth/g;

export default function RecordHyperlink({ value }: { value: string }) {
  const navigateToProfile = useCallback(() => {
    if (value.match(ENS_REGEX)) {
      Navigation.goBack();
      Navigation.handleAction(Routes.PROFILE_SHEET, {
        address: value,
        fromRoute: 'RecordHyperlink',
      });
    } else {
      openInBrowser((value.match('https') ? '' : 'https://') + value);
    }
  }, [value]);

  return (
    <ButtonPressAnimation onPress={navigateToProfile}>
      <Text color="action (Deprecated)" size="16px / 22px (Deprecated)" weight="regular">
        {value}
      </Text>
    </ButtonPressAnimation>
  );
}
