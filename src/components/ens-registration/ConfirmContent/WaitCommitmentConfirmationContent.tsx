import lang from 'i18n-js';
import React from 'react';
import {
  ButtonPressAnimation,
  HourglassAnimation,
} from '../../../components/animations';
import { Box, Text } from '@rainbow-me/design-system';

const WaitCommitmentConfirmationContent = ({
  accentColor,
  action,
}: {
  accentColor: any;
  action: () => void;
}) => {
  return (
    <Box height="full">
      <Box height="full">
        <HourglassAnimation />
      </Box>
      <Box alignItems="center" paddingBottom="5px">
        <ButtonPressAnimation onPress={action}>
          <Text
            color={{ custom: accentColor }}
            containsEmoji
            size="16px"
            weight="heavy"
          >
            {`🚀 ${lang.t('profiles.confirm.speed_up')}`}
          </Text>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
};

export default WaitCommitmentConfirmationContent;
