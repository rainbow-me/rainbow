import * as i18n from '@/languages';
import React from 'react';
import ButtonPressAnimation from '../../../components/animations/ButtonPressAnimation';
import HourglassAnimation from '../../../components/animations/HourglassAnimation';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import { Box } from '@/design-system/components/Box/Box';
import { Heading } from '@/design-system/components/Heading/Heading';
import { Inset } from '@/design-system/components/Inset/Inset';
import { Row, Rows } from '@/design-system/components/Rows/Rows';
import { Stack } from '@/design-system/components/Stack/Stack';
import { Text } from '@/design-system/components/Text/Text';
import useDimensions from '@/hooks/useDimensions';

const WaitCommitmentConfirmationContent = ({
  accentColor,
  action,
  secondsSinceCommitConfirmed,
}: {
  accentColor: any;
  action: () => void;
  secondsSinceCommitConfirmed: number;
}) => {
  const { isSmallPhone } = useDimensions();
  const speedUpEnabled = secondsSinceCommitConfirmed === -1;

  return (
    <>
      <Box paddingTop="24px">
        <StepIndicator currentStep={1} steps={3} />
      </Box>
      <Rows alignHorizontal="center">
        <Row>
          <Box flexGrow={1} justifyContent="center">
            <Inset horizontal="12px">
              <Stack space={isSmallPhone ? '24px' : '34px (Deprecated)'}>
                <HourglassAnimation />
                <Stack alignHorizontal="center" space="19px (Deprecated)">
                  <Heading align="center" color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
                    {i18n.t(i18n.l.profiles.confirm.transaction_pending)}
                  </Heading>
                  <Text align="center" color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                    {i18n.t(i18n.l.profiles.confirm.transaction_pending_description)}
                  </Text>
                </Stack>
              </Stack>
            </Inset>
          </Box>
        </Row>
      </Rows>
      <Inset bottom={isSmallPhone ? '30px (Deprecated)' : undefined}>
        <ButtonPressAnimation onPress={speedUpEnabled ? action : () => null}>
          <Text align="center" color={{ custom: accentColor }} containsEmoji size="16px / 22px (Deprecated)" weight="heavy">
            {`🚀 ${i18n.t(i18n.l.profiles.confirm.speed_up)}`}
          </Text>
        </ButtonPressAnimation>
      </Inset>
    </>
  );
};

export default WaitCommitmentConfirmationContent;
