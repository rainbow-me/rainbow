import { useNavigation } from '@react-navigation/core';
import { format, formatDistanceStrict } from 'date-fns';
import React, { useCallback, useState } from 'react';
import { TokenInfoItem } from '../../token-info';
import { useTheme } from '@rainbow-me/context';
import { Columns } from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useENSRegistration } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSBriefTokenInfoRow({
  expiryDate,
  registrationDate,
  showEditButton,
  ensName,
}: {
  expiryDate?: number;
  registrationDate?: number;
  ensName: string;
  showEditButton?: boolean;
}) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();
  const [showExpiryDistance, setShowExpiryDistance] = useState(true);
  const handlePressExpiryDate = useCallback(() => {
    setShowExpiryDistance(x => !x);
  }, []);

  const handlePressEditExpiryDate = useCallback(() => {
    startRegistration(ensName, REGISTRATION_MODES.RENEW);
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
      ensName,
      mode: REGISTRATION_MODES.RENEW,
    });
  }, [startRegistration, ensName, navigate]);

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
        align="right"
        color={colors.whiteLabel}
        enableHapticFeedback
        isNft
        loading={!expiryDate}
        onPress={handlePressExpiryDate}
        onPressEditButton={handlePressEditExpiryDate}
        showEditButton={showEditButton}
        size="big"
        title="Expires in"
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
