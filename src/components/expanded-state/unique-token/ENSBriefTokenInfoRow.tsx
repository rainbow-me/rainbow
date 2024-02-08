import { useNavigation } from '@react-navigation/native';
import { format, formatDistanceStrict } from 'date-fns';
import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import { ENSConfirmRenewSheetHeight } from '../../../screens/ENSConfirmRegisterSheet';
import { ButtonPressAnimation } from '../../animations';
import { TokenInfoItem, TokenInfoValue } from '../../token-info';
import { PROFILES, useExperimentalFlag } from '@/config';
import { Column, Columns, Inset } from '@/design-system';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useENSAvatar, useENSRegistration } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';

export default function ENSBriefTokenInfoRow({
  color,
  expiryDate,
  registrationDate,
  showExtendDuration,
  ensName,
  externalAvatarUrl,
}: {
  color?: string;
  expiryDate?: number;
  registrationDate?: number;
  ensName: string;
  showExtendDuration?: boolean;
  externalAvatarUrl?: string | null;
}) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { data: avatar } = useENSAvatar(ensName, { enabled: profilesEnabled });
  const [showExpiryDistance, setShowExpiryDistance] = useState(true);
  const handlePressExpiryDate = useCallback(() => {
    setShowExpiryDistance(x => !x);
  }, []);

  const handlePressEditExpiryDate = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      const cleanENSName = ensName?.split(' ')?.[0] ?? ensName;
      startRegistration(cleanENSName, REGISTRATION_MODES.RENEW);
      navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
        ensName: cleanENSName,
        externalAvatarUrl,
        longFormHeight: ENSConfirmRenewSheetHeight + (avatar?.imageUrl ? 70 : 0),
        mode: REGISTRATION_MODES.RENEW,
      });
    });
  }, [ensName, startRegistration, navigate, externalAvatarUrl, avatar?.imageUrl]);

  return (
    <Columns space="10px">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem color={colors.whiteLabel} isENS isNft loading={!registrationDate} size="larger" title="Registered on" weight="heavy">
        {registrationDate ? format(new Date(registrationDate * 1000), 'MMM d, yyyy') : ''}
      </TokenInfoItem>
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        addonComponent={
          showExtendDuration && (
            <Column width="content">
              <ButtonPressAnimation
                enableHapticFeedback
                onPress={handlePressEditExpiryDate}
                scaleTo={0.75}
                testID="unique-token-expanded-state-extend-duration"
              >
                <Inset left="4px">
                  <TokenInfoValue
                    activeOpacity={0}
                    align="right"
                    color={color}
                    isNft
                    lineHeight="paragraphSmaller"
                    size="large"
                    weight="heavy"
                  >
                    􀌆
                  </TokenInfoValue>
                </Inset>
              </ButtonPressAnimation>
            </Column>
          )
        }
        align="right"
        color={colors.whiteLabel}
        enableHapticFeedback
        isENS
        isNft
        loading={!expiryDate}
        onPress={handlePressExpiryDate}
        size="larger"
        title={lang.t(`expanded_state.unique_expanded.${showExpiryDistance ? 'expires_in' : 'expires_on'}`)}
        weight="heavy"
      >
        {expiryDate
          ? showExpiryDistance
            ? formatDistanceStrict(new Date(), new Date(expiryDate * 1000))
            : format(new Date(expiryDate * 1000), 'MMM d, yyyy')
          : ''}
      </TokenInfoItem>
    </Columns>
  );
}
