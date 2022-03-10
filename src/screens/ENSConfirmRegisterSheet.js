import { useFocusEffect, useRoute } from '@react-navigation/core';
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
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { accentColorAtom, ENS_DOMAIN } from '@rainbow-me/helpers/ens';
import {
  useENSRegistration,
  useENSRegistrationActionHandler,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSSearch,
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
export const ENSConfirmUpdateSheetHeight = 400;
const avatarSize = 70;

export default function ENSConfirmRegisterSheet() {
  const { params } = useRoute();
  const { theme } = useTheme();
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const {
    images: { avatarUrl: initialAvatarUrl },
    name: ensName,
    mode,
  } = useENSRegistration();
  const [gasLimit, setGasLimit] = useState();
  const [accentColor] = useRecoilState(accentColorAtom);

  const [duration, setDuration] = useState(1);
  const { step, stepGasLimit, action } = useENSRegistrationActionHandler({
    yearsDuration: duration,
  });
  const prevStepGasLimit = usePrevious(stepGasLimit);

  const { blurFields, values } = useENSRegistrationForm();
  const avatarUrl = initialAvatarUrl || values.avatar;

  const name = ensName.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
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

  useFocusEffect(() => {
    blurFields();
  });

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={params.longFormHeight || ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={accentColor}>
        <Box
          background="body"
          paddingVertical="30px"
          style={useMemo(
            () => ({
              height: params.longFormHeight || ENSConfirmRegisterSheetHeight,
            }),
            [params.longFormHeight]
          )}
        >
          <Rows>
            <Row>
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
                    {mode === 'create'
                      ? lang.t('profiles.confirm.confirm_purchase')
                      : lang.t('profiles.confirm.confirm_update')}
                  </Text>
                </Stack>
                <Inset vertical="24px">
                  <Divider color="divider40" />
                </Inset>
                <Stack space="34px">
                  {mode === 'create' && (
                    <>
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
                          registrationCostsData?.estimatedRentPrice?.total
                            ?.display
                        }
                        totalCost={
                          registrationCostsData?.estimatedTotalRegistrationCost
                            ?.display
                        }
                      />
                      <Divider color="divider40" />
                    </>
                  )}
                  {mode === 'edit' && <Text>TODO</Text>}
                </Stack>
              </Inset>
            </Row>
            <Row height="content">
              <Box>
                <Stack space="34px">
                  <Text align="center">Step: {step}</Text>
                  <Text align="center">Gas limit: {stepGasLimit}</Text>
                </Stack>
              </Box>
              {action ? (
                <>
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
                      asset={{ color: accentColor }}
                      currentNetwork="mainnet"
                      marginBottom={0}
                      theme={theme}
                    />
                  </Box>
                </>
              ) : (
                <Box alignItems="center">
                  <LoadingSpinner />
                </Box>
              )}
            </Row>
          </Rows>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
