import { isEmpty } from 'lodash';
import React, { useEffect } from 'react';
import { GasSpeedButton } from '../components/gas';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { RapActionTypes } from '../raps/common';
import { Box, Text } from '@rainbow-me/design-system';
import { getRentPrice } from '@rainbow-me/helpers/ens';
import { useAccountSettings, useENSProfile, useGas } from '@rainbow-me/hooks';
import { getRapEstimationByType } from '@rainbow-me/raps';
import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;
const secsInYear = 31536000;

export default function ENSConfirmRegisterSheet() {
  const { navigate, goBack } = useNavigation();
  const { accountAddress } = useAccountSettings();

  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const { name, records } = useENSProfile();

  const updateGasLimit = useCallback(async () => {
    const rentPrice = await getRentPrice(name, secsInYear);
    const gasLimit = await getRapEstimationByType(
      RapActionTypes.registerSetRecordsAndName,
      {
        ensRegistrationParameters: {
          duration: secsInYear,
          name: name,
          ownerAddress: accountAddress,
          records,
          rentPrice: rentPrice.toString(),
        },
      }
    );
    updateTxFee(gasLimit);
  }, [accountAddress, name, records, updateTxFee]);

  // Update gas limit
  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed)) {
      updateGasLimit();
    }
  }, [gasFeeParamsBySpeed, updateGasLimit, updateTxFee]);

  useEffect(() => startPollingGasFees(), [startPollingGasFees]);

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
        <Box alignItems="center" flexGrow={1} justifyContent="center">
          <Text>register confirmation placeholder</Text>
          <GasSpeedButton currentNetwork="mainnet" theme="light" />
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
