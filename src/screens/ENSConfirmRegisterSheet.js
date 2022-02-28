import { useFocusEffect, useRoute } from '@react-navigation/core';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRecoilState } from 'recoil';
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
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  accentColorAtom,
  ENS_DOMAIN,
  generateSalt,
} from '@rainbow-me/helpers/ens';
import {
  useAccountSettings,
  useCurrentNonce,
  useENSProfile,
  useENSProfileForm,
  useENSRegistration,
  useENSRegistrationCosts,
  useGas,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { loadWallet } from '@rainbow-me/model/wallet';
import { getRapEstimationByType } from '@rainbow-me/raps';
import { saveCommitRegistrationParameters } from '@rainbow-me/redux/ensRegistration';
import { timeUnits } from '@rainbow-me/references';

export const ENSConfirmRegisterSheetHeight = 600;
export const ENSConfirmUpdateSheetHeight = 400;
const avatarSize = 70;

export default function ENSConfirmRegisterSheet() {
  const { params } = useRoute();
  const dispatch = useDispatch();
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const {
    avatarUrl,
    name: ensName,
    mode,
    records,
    changedRecords,
  } = useENSProfile();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const [gasLimit, setGasLimit] = useState();
  const [accentColor] = useRecoilState(accentColorAtom);

  const [duration, setDuration] = useState(1);

  const { blurFields } = useENSProfileForm();
  useFocusEffect(() => {
    blurFields();
  });

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
    const salt = generateSalt();
    const gasLimit = await getRapEstimationByType(RapActionTypes.commitENS, {
      ensRegistrationParameters: {
        duration: duration * timeUnits.secs.year,
        name: name,
        ownerAddress: accountAddress,
        records: changedRecords,
        rentPrice,
        salt,
      },
    });
    updateTxFee(gasLimit);
    setGasLimit(gasLimit);
  }, [accountAddress, changedRecords, duration, name, rentPrice, updateTxFee]);

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
      duration: duration * timeUnits.secs.year,
      name,
      nonce,
      ownerAddress: accountAddress,
      records,
      rentPrice,
      salt,
    };

    dispatch(
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
    //   {
    //     ensRegistrationParameters: {
    //       ...ensRegistrationParameters,
    //       records: changedRecords
    //     },
    //   },
    //   callback
    // );
  }, [
    accountAddress,
    dispatch,
    duration,
    getNextNonce,
    name,
    records,
    rentPrice,
  ]);

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
                    Confirm {mode === 'create' ? 'purchase' : 'update'}
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
                          Buy more years now to save on fees
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
                <GasSpeedButton
                  currentNetwork="mainnet"
                  marginBottom={0}
                  theme="light"
                />
              </Box>
            </Row>
          </Rows>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
