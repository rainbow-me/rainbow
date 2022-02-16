import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import brain from '../assets/brain.png';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import {
  AccentColorProvider,
  Box,
  Divider,
  Heading,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { useENSRegistration, useENSRegistrationCosts } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;

export default function ENSConfirmRegisterSheet() {
  const { navigate, goBack } = useNavigation();
  const { params } = useRoute();
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

  const avatarSize = 70;

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={params.color}>
        <Box
          background="body"
          paddingVertical="30px"
          style={{ height: ENSConfirmRegisterSheetHeight }}
        >
          <Box flexGrow={1}>
            <Inset horizontal="30px">
              <Stack alignHorizontal="center" space="15px">
                {params.avatarUrl && (
                  <Box
                    background="swap"
                    borderRadius={avatarSize / 2}
                    height={{ custom: avatarSize }}
                    shadow="12px heavy accent"
                    width={{ custom: avatarSize }}
                  />
                )}
                <Heading size="26px">{ensName}</Heading>
                <Text color="accent" weight="heavy">
                  Confirm purchase
                </Text>
              </Stack>
              <Inset vertical="24px">
                <Divider color="divider40" />
              </Inset>
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
                  accentColor={params.color}
                  duration={duration}
                  maxDuration={99}
                  networkFee={
                    registrationCostsData?.estimatedNetworkFee?.display
                  }
                  onChangeDuration={setDuration}
                  registrationFee={
                    registrationCostsData?.estimatedRentPrice?.total?.display
                  }
                  totalCost={
                    registrationCostsData?.estimatedTotalRegistrationCost
                      ?.display
                  }
                />
                <Divider color="divider40" />
              </Stack>
            </Inset>
          </Box>
          <SheetActionButtonRow>
            <HoldToAuthorizeButton
              backgroundColor={params.color}
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
      </AccentColorProvider>
    </SlackSheet>
  );
}
