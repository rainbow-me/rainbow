import { useRoute } from '@react-navigation/core';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import brain from '../assets/brain.png';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import { RapActionTypes } from '../raps/common';
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
import { generateSalt } from '@rainbow-me/helpers/ens';
import {
  useAccountSettings,
  useCurrentNonce,
  useENSProfile,
  useENSRegistration,
  useENSRegistrationCosts,
  useGas,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { loadWallet } from '@rainbow-me/model/wallet';
import { getRapEstimationByType } from '@rainbow-me/raps';
import { saveCommitRegistrationParameters } from '@rainbow-me/redux/ensRegistration';

export const ENSConfirmRegisterSheetHeight = 600;
const secsInYear = 31536000;
const avatarSize = 70;

export default function ENSConfirmRegisterSheet() {
  const dispatch = useDispatch();
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const { name: ensName, records } = useENSProfile();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const [gasLimit, setGasLimit] = useState();
  const { params } = useRoute();

  const [duration, setDuration] = useState(1);

  const name = ensName.replace('.eth', '');
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
    const salt = generateSalt();
    const gasLimit = await getRapEstimationByType(RapActionTypes.commitENS, {
      ensRegistrationParameters: {
        duration: secsInYear,
        name: name,
        ownerAddress: accountAddress,
        records,
        rentPrice,
        salt,
      },
    });
    updateTxFee(gasLimit);
    setGasLimit(gasLimit);
  }, [accountAddress, name, records, rentPrice, updateTxFee]);

  // Update gas limit
  useEffect(() => {
    if (!gasLimit && !isEmpty(gasFeeParamsBySpeed)) {
      updateGasLimit();
    }
  }, [gasFeeParamsBySpeed, gasLimit, updateGasLimit, updateTxFee]);

  useEffect(() => startPollingGasFees(), [startPollingGasFees]);

  const handleCommitSubmit = useCallback(async () => {
    const wallet = await loadWallet();
    if (!wallet) {
      return;
    }

    const nonce = await getNextNonce();
    const salt = generateSalt();

    const ensRegistrationParameters = {
      duration: secsInYear,
      name,
      nonce,
      ownerAddress: accountAddress,
      records,
      rentPrice,
      salt,
    };

    await dispatch(
      saveCommitRegistrationParameters(
        accountAddress,
        ensRegistrationParameters
      )
    );
    return;
    // LEAVING THIS AS WIP TO AVOID PEOPLE ON THE TEAM  SENDING THIS TX

    // const callback = () => null;

    // await executeRap(
    //   wallet,
    //   RapActionTypes.commitENS,
    //   { ensRegistrationParameters },
    //   callback
    // );
  }, [accountAddress, dispatch, getNextNonce, name, records, rentPrice]);

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
          <Box style={{ bottom: 0 }}>
            <Box>
              <SheetActionButtonRow paddingBottom={5}>
                <HoldToAuthorizeButton
                  hideInnerBorder
                  isLongPressAvailableForBiometryType
                  label="Hold to Commit"
                  onLongPress={handleCommitSubmit}
                  parentHorizontalPadding={19}
                  showBiometryIcon
                />
              </SheetActionButtonRow>
            </Box>
            <Box alignItems="center" justifyContent="center">
              <GasSpeedButton currentNetwork="mainnet" theme="light" />
            </Box>
          </Box>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
