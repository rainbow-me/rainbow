import lang from 'i18n-js';
import React from 'react';
import {
  ButtonPressAnimation,
  HourglassAnimation,
} from '../../../components/animations';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import {
  Box,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

const WaitCommitmentConfirmationContent = ({
  accentColor,
  action,
}: {
  accentColor: any;
  action: () => void;
}) => {
  const { isSmallPhone } = useDimensions();

  return (
    <>
      <Box paddingTop="24px">
        <StepIndicator currentStep={1} steps={3} />
      </Box>
      <Rows alignHorizontal="center">
        <Row>
          <Box flexGrow={1} justifyContent="center">
            <Inset horizontal="12px">
              <Stack space={isSmallPhone ? '24px' : '34px'}>
                <HourglassAnimation />
                <Stack alignHorizontal="center" space="19px">
                  <Heading align="center" size="23px">
                    {lang.t('profiles.confirm.transaction_pending')}
                  </Heading>
                  <Text align="center" color="secondary60" weight="semibold">
                    {lang.t('profiles.confirm.transaction_pending_description')}
                  </Text>
                </Stack>
              </Stack>
            </Inset>
          </Box>
        </Row>
      </Rows>
      <Inset bottom={isSmallPhone ? '30px' : undefined}>
        <ButtonPressAnimation onPress={action}>
          <Text
            align="center"
            color={{ custom: accentColor }}
            containsEmoji
            size="16px"
            weight="heavy"
          >
            {`🚀 ${lang.t('profiles.confirm.speed_up')}`}
          </Text>
        </ButtonPressAnimation>
      </Inset>
    </>
  );
};

export default WaitCommitmentConfirmationContent;
