import { format, formatDistanceStrict } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { TokenInfoItem } from '../../token-info';
import { useTheme } from '@rainbow-me/context';
import { Columns } from '@rainbow-me/design-system';

export default function ENSBriefTokenInfoRow({
  expiryDate,
  registrationDate,
}: {
  expiryDate?: number;
  registrationDate?: number;
}) {
  const { colors } = useTheme();

  const [showExpiryDistance, setShowExpiryDistance] = useState(true);
  const handlePressExpiryDate = useCallback(() => {
    setShowExpiryDistance(x => !x);
  }, []);

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
