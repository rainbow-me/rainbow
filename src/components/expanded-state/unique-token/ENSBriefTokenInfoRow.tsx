import { useNavigation } from '@react-navigation/core';
import { format, formatDistanceStrict } from 'date-fns';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { ENSConfirmRenewSheetHeight } from '../../../screens/ENSConfirmRegisterSheet';
import { ButtonPressAnimation } from '../../animations';
import { TokenInfoItem, TokenInfoValue } from '../../token-info';
import { useTheme } from '@rainbow-me/context';
import { Column, Columns } from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useENSProfile, useENSRegistration } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSBriefTokenInfoRow({
  expiryDate,
  registrationDate,
  showExtendDuration,
  ensName,
}: {
  expiryDate?: number;
  registrationDate?: number;
  ensName: string;
  showExtendDuration?: boolean;
}) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();
  const { data } = useENSProfile(ensName);
  const [showExpiryDistance, setShowExpiryDistance] = useState(true);
  const [expiryItemTitle, setExpiryItemTitle] = useState(
    lang.t('expanded_state.unique_expanded.expires_in')
  );
  const handlePressExpiryDate = useCallback(() => {
    setShowExpiryDistance(x => !x);
  }, []);

  useEffect(() => {
    if (showExpiryDistance) {
      setExpiryItemTitle(lang.t('expanded_state.unique_expanded.expires_in'));
    } else {
      setExpiryItemTitle(lang.t('expanded_state.unique_expanded.expires_on'));
    }
  }, [showExpiryDistance]);

  const handlePressEditExpiryDate = useCallback(() => {
    const cleanENSName = ensName?.split(' ')?.[0] ?? ensName;
    startRegistration(cleanENSName, REGISTRATION_MODES.RENEW);
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
      ensName: cleanENSName,
      longFormHeight:
        ENSConfirmRenewSheetHeight + (data?.images?.avatarUrl ? 70 : 0),
      mode: REGISTRATION_MODES.RENEW,
    });
  }, [startRegistration, ensName, navigate, data?.images?.avatarUrl]);

  return (
    <Columns space="19px">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        color={colors.whiteLabel}
        isNft
        loading={!registrationDate}
        size="big"
        title="Registered on"
        weight="heavy"
      >
        {registrationDate
          ? format(new Date(registrationDate * 1000), "d MMM ''yy")
          : ''}
      </TokenInfoItem>
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        addonComponent={
          showExtendDuration && (
            <Column width="content">
              <ButtonPressAnimation
                enableHapticFeedback
                onPress={handlePressEditExpiryDate}
                scaleTo={1}
                testID="unique-token-expanded-state-extend-duration"
              >
                <TokenInfoValue
                  activeOpacity={0}
                  align="right"
                  color={colors.whiteLabel}
                  isNft
                  size="big"
                  weight="heavy"
                >
                  {' 􀌆'}
                </TokenInfoValue>
              </ButtonPressAnimation>
            </Column>
          )
        }
        align="right"
        color={colors.whiteLabel}
        enableHapticFeedback
        isNft
        loading={!expiryDate}
        onPress={handlePressExpiryDate}
        size="big"
        title={expiryItemTitle}
        weight="heavy"
      >
        {expiryDate
          ? showExpiryDistance
            ? formatDistanceStrict(new Date(), new Date(expiryDate * 1000))
            : format(new Date(expiryDate * 1000), "d MMM ''yy")
          : ''}
      </TokenInfoItem>
    </Columns>
  );
}
