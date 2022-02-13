import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ReviewRegistration } from '../components/ens-registration';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Inset } from '@rainbow-me/design-system';
import { useENSRegistration, useENSRegistrationCosts } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;

export default function ENSConfirmRegisterSheet() {
  const { navigate, goBack } = useNavigation();
  const ensName = useSelector(({ ensRegistration }) => ensRegistration.name);

  const [duration, setDuration] = useState(2);

  const { data: registrationData } = useENSRegistration({
    name: ensName.replace('.eth', ''),
  });

  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name: ensName.replace('.eth', ''),
    rentPrice: registrationData?.rentPrice,
  });

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box
        background="body"
        paddingVertical="30px"
        style={{ height: ENSConfirmRegisterSheetHeight }}
      >
        <Box flexGrow={1}>
          <Inset horizontal="30px">
            <ReviewRegistration
              duration={duration}
              networkFee={registrationCostsData?.estimatedNetworkFeeCost}
              onChangeDuration={setDuration}
              registrationCost={registrationCostsData?.estimatedRentPrice}
              totalCost={registrationCostsData?.estimatedTotalRegistrationCost}
            />
          </Inset>
        </Box>
        <SheetActionButtonRow>
          <SheetActionButton
            label="Hold to Buy"
            onPress={() => {
              goBack();
              setTimeout(() => {
                navigate(Routes.PROFILE_SCREEN);
              }, 50);
            }}
            size="big"
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Box>
    </SlackSheet>
  );
}
