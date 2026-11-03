import React, { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';

import { format, formatDistanceStrict } from 'date-fns';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { TokenInfoItem, TokenInfoValue } from '@/components/token-info';
import { Column, Columns, Inset } from '@/design-system';
import { PROFILES } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { ENSConfirmRenewSheetHeight } from '../screens/ENSConfirmRegisterSheet';

export function ENSBriefTokenInfoRow({
  color,
  expiryDate,
  registrationDate,
  showExtendDuration,
  ensName,
  externalAvatarUrl,
}: {
  color?: string;
  expiryDate?: number | null;
  registrationDate?: number | null;
  ensName: string;
  showExtendDuration?: boolean;
  externalAvatarUrl?: string | null;
}) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const accountAddress = useAccountAddress();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const avatar = useEnsImageStore(s => s.get(profilesEnabled && ensName ? { name: ensName, field: 'avatar' } : undefined));
  const [showExpiryDistance, setShowExpiryDistance] = useState(true);
  const handlePressExpiryDate = useCallback(() => {
    setShowExpiryDistance(x => !x);
  }, []);

  const handlePressEditExpiryDate = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      const cleanENSName = ensName?.split(' ')?.[0] ?? ensName;
      useEnsRegistrationStore.getState().start(accountAddress, cleanENSName, REGISTRATION_MODES.RENEW);
      navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
        ensName: cleanENSName,
        externalAvatarUrl,
        longFormHeight: ENSConfirmRenewSheetHeight + (avatar ? 70 : 0),
        mode: REGISTRATION_MODES.RENEW,
      });
    });
  }, [ensName, accountAddress, navigate, externalAvatarUrl, avatar]);

  return (
    <Columns space="10px">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        color={colors.whiteLabel}
        isENS
        isNft
        loading={registrationDate === undefined}
        size="larger"
        title={i18n.t(i18n.l.ens.registered_on)}
        weight="heavy"
      >
        {registrationDate ? format(new Date(registrationDate * 1000), 'MMM d, yyyy') : '—'}
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
        loading={expiryDate === undefined}
        onPress={handlePressExpiryDate}
        size="larger"
        title={i18n.t(
          showExpiryDistance ? i18n.l.expanded_state.unique_expanded.expires_in : i18n.l.expanded_state.unique_expanded.expires_on
        )}
        weight="heavy"
      >
        {expiryDate
          ? showExpiryDistance
            ? formatDistanceStrict(new Date(), new Date(expiryDate * 1000))
            : format(new Date(expiryDate * 1000), 'MMM d, yyyy')
          : '—'}
      </TokenInfoItem>
    </Columns>
  );
}
