import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import brain from '../assets/brain.png';
import ActivityIndicator from '../components/ActivityIndicator';
import Spinner from '../components/Spinner';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
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
import { accentColorAtom, ENS_DOMAIN } from '@rainbow-me/helpers/ens';
import {
  useENSProfile,
  useENSRegistration,
  useENSRegistrationActionHandler,
  useENSRegistrationCosts,
  useGas,
  usePrevious,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
  })
)({
  marginRight: 2,
});

export const ENSConfirmRegisterSheetHeight = 600;
const avatarSize = 70;

export default function ENSConfirmRegisterSheet() {
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const { avatarUrl, name: ensName } = useENSProfile();
  const [gasLimit, setGasLimit] = useState();
  const [accentColor] = useRecoilState(accentColorAtom);

  const [duration, setDuration] = useState(1);
  const { step, stepGasLimit, action } = useENSRegistrationActionHandler({
    yearsDuration: duration,
  });
  const prevStepGasLimit = usePrevious(stepGasLimit);

  const name = ensName.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSRegistration({
    name,
  });
  const rentPrice = registrationData?.rentPrice;
  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name,
    rentPrice,
  });

  const updateGasLimit = useCallback(async () => {
    updateTxFee(stepGasLimit);
    setGasLimit(stepGasLimit);
  }, [stepGasLimit, updateTxFee]);

  // Update gas limit
  useEffect(() => {
    if (
      (!gasLimit && stepGasLimit && !isEmpty(gasFeeParamsBySpeed)) ||
      prevStepGasLimit !== stepGasLimit
    ) {
      updateGasLimit();
    }
  }, [
    gasFeeParamsBySpeed,
    gasLimit,
    prevStepGasLimit,
    stepGasLimit,
    updateGasLimit,
    updateTxFee,
  ]);

  useEffect(() => startPollingGasFees(), [startPollingGasFees]);

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={accentColor}>
        <Box
          background="body"
          paddingVertical="30px"
          style={useMemo(() => ({ height: ENSConfirmRegisterSheetHeight }), [])}
        >
          <Box flexGrow={1}>
            <Inset horizontal="30px">
              <Stack alignHorizontal="center" space="15px">
                {avatarUrl && (
                  <Box
                    background="accent"
                    borderRadius={avatarSize / 2}
                    height={{ custom: avatarSize }}
                    shadow="12px heavy accent"
                    width={{ custom: avatarSize }}
                  >
                    <Box
                      as={ImgixImage}
                      borderRadius={avatarSize / 2}
                      height={{ custom: avatarSize }}
                      source={{ uri: avatarUrl }}
                      width={{ custom: avatarSize }}
                    />
                  </Box>
                )}
                <Heading size="26px">{ensName}</Heading>
                <Text color="accent" weight="heavy">
                  {lang.t('profiles.confirm.description')}
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
                      style={useMemo(() => ({ height: 20, width: 20 }), [])}
                    />
                  </Box>
                  <Text color="secondary50" size="14px" weight="heavy">
                    {lang.t('profiles.confirm.suggestion')}
                  </Text>
                </Inline>
                <RegistrationReviewRows
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
          <Box>
            <Stack space="34px">
              <Text align="center">Step: {step}</Text>
              <Text align="center">Gas limit: {stepGasLimit}</Text>
            </Stack>
          </Box>
          {action ? (
            <Box style={{ bottom: 0 }}>
              <Box>
                <SheetActionButtonRow paddingBottom={5}>
                  <HoldToAuthorizeButton
                    color={accentColor}
                    hideInnerBorder
                    isLongPressAvailableForBiometryType
                    label={step}
                    onLongPress={action}
                    parentHorizontalPadding={19}
                    showBiometryIcon
                  />
                </SheetActionButtonRow>
              </Box>
              <Box alignItems="center" justifyContent="center">
                <GasSpeedButton
                  borderColor={accentColor}
                  currentNetwork="mainnet"
                  theme="light"
                />
              </Box>
            </Box>
          ) : (
            <Box alignItems="center">
              <LoadingSpinner />
            </Box>
          )}
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
