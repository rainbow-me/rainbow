import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { GasSpeedButton } from '../components/gas';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { executeRap, RapActionTypes } from '../raps/common';
import { Box, Text } from '@rainbow-me/design-system';
import { getRentPrice } from '@rainbow-me/helpers/ens';
import { addBuffer } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useCurrentNonce,
  useENSProfile,
  useGas,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { getRapEstimationByType } from '@rainbow-me/raps';
// import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;
const secsInYear = 31536000;

const Timer = ({ seconds }) => {
  // initialize timeLeft with the seconds prop
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    // exit early when we reach 0
    if (!timeLeft) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
    // add timeLeft as a dependency to re-rerun the effect
    // when we update it
  }, [timeLeft]);

  return <Text>{timeLeft}</Text>;
};

export default function ENSConfirmRegisterSheet() {
  // const { navigate, goBack } = useNavigation();
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const { name, records } = useENSProfile();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const [rentPrice, setRentPrice] = useState();
  const [gasLimit, setGasLimit] = useState();

  useEffect(() => {
    const callbackGetRentPrice = async () => {
      const rentPrice = await getRentPrice(name, secsInYear);
      setRentPrice(addBuffer(rentPrice.toString(), 1.1));
    };
    callbackGetRentPrice();
  }, [name]);

  const updateGasLimit = useCallback(async () => {
    const gasLimit = await getRapEstimationByType(RapActionTypes.commitENS, {
      ensRegistrationParameters: {
        duration: secsInYear,
        name: name,
        ownerAddress: accountAddress,
        records,
        rentPrice: rentPrice.toString(),
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

    const callback = (success = false, errorMessage = null) => {
      // eslint-disable-next-line no-console
      console.log('😬😬😬 handleCommitSubmit CALLBACK ', success, errorMessage);
    };
    const nonce = await getNextNonce();
    const ensRegistrationParameters = {
      duration: secsInYear,
      name,
      nonce,
      ownerAddress: accountAddress,
      records,
      rentPrice: rentPrice.toString(),
    };
    await executeRap(
      wallet,
      RapActionTypes.commitENS,
      {},
      ensRegistrationParameters,
      callback
    );
  }, [accountAddress, getNextNonce, name, records, rentPrice]);

  const handleRegisterSubmit = useCallback(async () => {
    const wallet = await loadWallet();
    if (!wallet) {
      return;
    }
    const callback = (success = false, errorMessage = null) => {
      // eslint-disable-next-line no-console
      console.log(
        '😬😬😬 handleRegisterSubmit CALLBACK ',
        success,
        errorMessage
      );
    };
    const nonce = await getNextNonce();
    const ensRegistrationParameters = {
      duration: secsInYear,
      name,
      nonce,
      ownerAddress: accountAddress,
      records,
      rentPrice: rentPrice.toString(),
    };
    await executeRap(
      wallet,
      RapActionTypes.registerSetRecordsAndName,
      {},
      ensRegistrationParameters,
      callback
    );
  }, [accountAddress, getNextNonce, name, records, rentPrice]);

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
          <Text>{rentPrice}</Text>
          <Timer seconds={70} />
          <GasSpeedButton currentNetwork="mainnet" theme="light" />
        </Box>
        <SheetActionButtonRow>
          <SheetActionButton
            label="Commit"
            onPress={handleCommitSubmit}
            size="big"
            weight="heavy"
          />
          <SheetActionButton
            label="Register"
            onPress={handleRegisterSubmit}
            size="big"
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Box>
    </SlackSheet>
  );
}
