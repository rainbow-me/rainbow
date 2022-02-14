import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import brain from '../assets/brain.png';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Inline, Inset, Stack, Text } from '@rainbow-me/design-system';
import { useENSRegistration, useENSRegistrationCosts } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;

export default function ENSConfirmRegisterSheet() {
  const { navigate, goBack } = useNavigation();
  const ensName = useSelector(({ ensRegistration }) => ensRegistration.name);

  const [duration, setDuration] = useState(1);

  const name = ensName.replace('.eth', '');
  const { data: registrationData } = useENSRegistration({
    name,
  });
  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name,
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
            <Stack space="34px">
              <Inline
                alignHorizontal="center"
                alignVertical="center"
                space="6px"
                wrap={false}
              >
                <Box>
                  <ImgixImage
                    source={brain}
                    style={{ height: 20, width: 20 }}
                  />
                </Box>
                <Text color="secondary50" size="14px" weight="heavy">
                  Buy more years now to save on fees
                </Text>
              </Inline>
              <RegistrationReviewRows
                duration={duration}
                maxDuration={99}
                networkFee={registrationCostsData?.estimatedNetworkFee?.display}
                onChangeDuration={setDuration}
                registrationFee={
                  registrationCostsData?.estimatedRentPrice?.total?.display
                }
                totalCost={
                  registrationCostsData?.estimatedTotalRegistrationCost?.display
                }
              />
            </Stack>
          </Inset>
        </Box>
        <SheetActionButtonRow>
          <HoldToAuthorizeButton
            hideInnerBorder
            label="Hold to Buy"
            onLongPress={() => {
              goBack();
              setTimeout(() => {
                navigate(Routes.PROFILE_SCREEN);
              }, 50);
            }}
            parentHorizontalPadding={19}
            showBiometryIcon
          />
        </SheetActionButtonRow>
      </Box>
    </SlackSheet>
  );
}
