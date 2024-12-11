import { RouteProp, useRoute } from '@react-navigation/native';
import { BigNumber } from 'bignumber.js';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import Routes from '@/navigation/routesNames';
import React, { ComponentProps, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import Divider from '@/components/Divider';
import Spinner from '../components/Spinner';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row } from '../components/layout';
import { SheetActionButton, SheetActionButtonRow, SheetHandleFixedToTop, SheetKeyboardAnimation, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { removeRegistrationByName, saveCommitRegistrationParameters } from '@/redux/ensRegistration';
import { GasFeeType, GasFeeTypes, LegacyTransactionGasParamAmounts, TransactionGasParamAmounts, TransactionStatus } from '@/entities';
import { getProvider, isL2Chain, toHex } from '@/handlers/web3';
import { greaterThan } from '@/helpers/utilities';
import { useAccountSettings, useDimensions, useGas, useWallets } from '@/hooks';
import { sendTransaction } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import { parseGasParamsForTransaction } from '@/parsers';
import { updateGasFeeForSpeed } from '@/redux/gas';
import { ethUnits } from '@/references';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { gasUtils, safeAreaInsetValues } from '@/utils';
import * as i18n from '@/languages';
import { updateTransaction } from '@/state/pendingTransactions';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { ThemeContextProps, useTheme } from '@/theme';
import { BigNumberish } from '@ethersproject/bignumber';
import { RootStackParamList } from '@/navigation/types';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BytesLike } from '@ethersproject/bytes';

const { CUSTOM, URGENT } = gasUtils;

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

type WithThemeContextProps = {
  deviceHeight: number;
  height: number;
  theme: ThemeContextProps;
};

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }: WithThemeContextProps) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

const CenteredSheet = styled(Centered)({
  borderTopLeftRadius: 39,
  borderTopRightRadius: 39,
});

const ExtendedSheetBackground = styled(View)({
  backgroundColor: ({ theme: { colors } }: WithThemeContextProps) => colors.white,
  bottom: -800,
  height: 1000,
  position: 'absolute',
  width: '100%',
});

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(({ theme: { colors } }: WithThemeContextProps) => ({
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'large',
}))({});

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent<ComponentProps<typeof CenteredSheet>>(CenteredSheet);

const GasSpeedButtonContainer = styled(Row).attrs({
  justify: 'center',
})({});

const CANCEL_TX = 'cancel';
const SPEED_UP = 'speed_up';
// i18n

const title = {
  [CANCEL_TX]: i18n.t(i18n.l.wallet.transaction.speed_up.cancel_tx_title),
  [SPEED_UP]: i18n.t(i18n.l.wallet.transaction.speed_up.speed_up_title),
};
// i18n

const text = {
  [CANCEL_TX]: i18n.t(i18n.l.wallet.transaction.speed_up.cancel_tx_text),
  [SPEED_UP]: i18n.t(i18n.l.wallet.transaction.speed_up.speed_up_text),
};

const calcGasParamRetryValue = (prevWeiValue: BigNumberish) => {
  const prevWeiValueBN = new BigNumber(prevWeiValue.toString());

  const newWeiValueBN = prevWeiValueBN.times(new BigNumber('110')).dividedBy(new BigNumber('100'));

  const newWeiValue = newWeiValueBN.toFixed(0);
  return Number(newWeiValue);
};

export default function SpeedUpAndCancelSheet() {
  const { navigate, goBack } = useNavigation();
  const { accountAddress, chainId } = useAccountSettings();
  const { isHardwareWallet } = useWallets();
  const dispatch = useDispatch();
  const { height: deviceHeight } = useDimensions();
  const { gasFeeParamsBySpeed, updateGasFeeOption, selectedGasFee, startPollingGasFees, stopPollingGasFees, updateTxFee } = useGas();
  const calculatingGasLimit = useRef(false);
  const speedUrgentSelected = useRef(false);
  const {
    params: { type, tx, accentColor },
  } = useRoute<RouteProp<RootStackParamList, 'SpeedUpAndCancelSheet' | 'SpeedUpAndCancelBootomSheet'>>();

  const [ready, setReady] = useState(false);
  const [txType, setTxType] = useState<GasFeeType>();
  const [minGasPrice, setMinGasPrice] = useState(tx?.gasPrice ? calcGasParamRetryValue(tx.gasPrice) : undefined);
  const [minMaxPriorityFeePerGas, setMinMaxPriorityFeePerGas] = useState(
    tx?.maxPriorityFeePerGas ? calcGasParamRetryValue(tx.maxPriorityFeePerGas) : undefined
  );
  const [minMaxFeePerGas, setMinMaxFeePerGas] = useState(tx?.maxFeePerGas ? calcGasParamRetryValue(tx.maxFeePerGas) : undefined);
  const fetchedTx = useRef(false);
  const [currentChainId, setCurrentChainId] = useState<ChainId>(ChainId.mainnet);
  const [currentProvider, setCurrentProvider] = useState<StaticJsonRpcProvider>(getProvider({ chainId: ChainId.mainnet }));
  const [data, setData] = useState<BytesLike>();
  const [gasLimit, setGasLimit] = useState<BigNumberish>();
  const [nonce, setNonce] = useState<BigNumberish>();
  const [to, setTo] = useState<string | undefined>(tx?.to ?? undefined);
  const [value, setValue] = useState<string>();
  const isL2 = isL2Chain({ chainId: tx?.chainId });

  const getNewTransactionGasParams = useCallback(() => {
    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    if (txType === GasFeeTypes.eip1559) {
      const rawMaxPriorityFeePerGas = (gasParams as TransactionGasParamAmounts).maxPriorityFeePerGas;
      const rawMaxFeePerGas = (gasParams as TransactionGasParamAmounts).maxFeePerGas;

      const maxPriorityFeePerGas = greaterThan(rawMaxPriorityFeePerGas, minMaxPriorityFeePerGas ?? 0)
        ? toHex(rawMaxPriorityFeePerGas)
        : toHex(minMaxPriorityFeePerGas ?? 0);

      const maxFeePerGas = greaterThan(rawMaxFeePerGas, minMaxFeePerGas ?? 0) ? toHex(rawMaxFeePerGas) : toHex(minMaxFeePerGas ?? 0);
      return { maxFeePerGas, maxPriorityFeePerGas };
    } else {
      const rawGasPrice = (gasParams as LegacyTransactionGasParamAmounts).gasPrice;
      return {
        gasPrice: greaterThan(rawGasPrice, minGasPrice ?? 0) ? toHex(rawGasPrice) : toHex(minGasPrice ?? 0),
      };
    }
  }, [txType, selectedGasFee, minMaxPriorityFeePerGas, minMaxFeePerGas, minGasPrice]);

  const cancelCommitTransactionHash = useCallback(() => {
    if (tx?.ensCommitRegistrationName) {
      dispatch(removeRegistrationByName(tx?.ensCommitRegistrationName));
    }
  }, [dispatch, tx?.ensCommitRegistrationName]);

  const handleCancellation = useCallback(async () => {
    try {
      const newGasParams = getNewTransactionGasParams();
      const cancelTxPayload = {
        nonce,
        to: accountAddress,
        ...newGasParams,
      };
      const res = await sendTransaction({
        provider: currentProvider,
        transaction: cancelTxPayload,
      });

      if (tx?.ensCommitRegistrationName) {
        cancelCommitTransactionHash();
      }
      const updatedTx = { ...tx, nonce: tx.nonce ?? 0 };
      // Update the hash on the copy of the original tx
      if (res?.result?.hash) {
        updatedTx.hash = res.result.hash;
      }
      updatedTx.status = TransactionStatus.pending;
      updatedTx.type = 'cancel';
      updateTransaction({
        address: accountAddress,
        transaction: updatedTx,
        chainId: currentChainId,
      });
    } catch (e) {
      logger.error(new RainbowError(`[SpeedUpAndCancelSheet]: error submitting cancel tx: ${e}`));
    } finally {
      // if its a hardware wallet we need to close the hardware tx sheet
      if (isHardwareWallet) {
        goBack();
      }
      goBack();
    }
  }, [
    accountAddress,
    cancelCommitTransactionHash,
    currentChainId,
    currentProvider,
    getNewTransactionGasParams,
    goBack,
    isHardwareWallet,
    nonce,
    tx,
  ]);

  const handleCancellationWrapperFn = useCallback(async () => {
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
        submit: handleCancellation,
      });
    } else {
      handleCancellation();
    }
  }, [handleCancellation, isHardwareWallet, navigate]);

  const saveCommitTransactionHash = useCallback(
    (hash: string) => {
      dispatch(
        saveCommitRegistrationParameters({
          commitTransactionHash: hash,
          name: tx?.ensCommitRegistrationName,
        })
      );
    },
    [dispatch, tx?.ensCommitRegistrationName]
  );

  const handleSpeedUp = useCallback(async () => {
    try {
      const newGasParams = getNewTransactionGasParams();
      const fasterTxPayload = {
        data,
        gasLimit,
        nonce,
        to,
        value,
        ...newGasParams,
      };

      const res = await sendTransaction({
        provider: currentProvider,
        transaction: fasterTxPayload,
      });

      if (tx?.ensCommitRegistrationName && res?.result?.hash) {
        saveCommitTransactionHash(res.result.hash);
      }
      const updatedTx = { ...tx, nonce: tx.nonce ?? 0 };
      // Update the hash on the copy of the original tx
      if (res?.result?.hash) {
        updatedTx.hash = res.result.hash;
      }
      updatedTx.status = TransactionStatus.pending;
      updatedTx.type = 'speed_up';

      updateTransaction({
        address: accountAddress,
        transaction: updatedTx,
        chainId: currentChainId,
      });
    } catch (e) {
      logger.error(new RainbowError(`[SpeedUpAndCancelSheet]: error submitting speed up tx: ${e}`));
    } finally {
      // if its a hardware wallet we need to close the hardware tx sheet
      if (isHardwareWallet) {
        goBack();
      }
      goBack();
    }
  }, [
    accountAddress,
    currentChainId,
    currentProvider,
    data,
    gasLimit,
    getNewTransactionGasParams,
    goBack,
    isHardwareWallet,
    nonce,
    saveCommitTransactionHash,
    to,
    tx,
    value,
  ]);

  const handleSpeedUpWrapperFn = useCallback(async () => {
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: handleSpeedUp });
    } else {
      handleSpeedUp();
    }
  }, [handleSpeedUp, isHardwareWallet, navigate]);

  // Set the network
  useEffect(() => {
    setCurrentChainId(tx?.chainId || chainId);
  }, [chainId, tx.chainId]);

  // Set the provider
  useEffect(() => {
    if (currentChainId) {
      startPollingGasFees(currentChainId);
      const provider = getProvider({ chainId: currentChainId });
      logger.debug(`[SpeedUpAndCancelSheet]: using provider for network ${tx?.chainId}`);
      setCurrentProvider(provider);

      return () => {
        stopPollingGasFees();
      };
    }
  }, [currentChainId, startPollingGasFees, stopPollingGasFees, tx?.chainId]);

  // Update gas limit
  useEffect(() => {
    if (!speedUrgentSelected.current && !isEmpty(gasFeeParamsBySpeed) && gasLimit) {
      updateTxFee(gasLimit);
      // Always default to urgent
      updateGasFeeOption(gasUtils.URGENT);
      speedUrgentSelected.current = true;
    }
  }, [gasLimit, gasFeeParamsBySpeed, updateGasFeeOption, updateTxFee]);

  useEffect(() => {
    const init = async () => {
      if (currentChainId && currentProvider && !fetchedTx.current) {
        try {
          fetchedTx.current = true;

          if (tx.value) {
            setValue(toHex(tx?.value?.toString()));
          }

          if (tx.to) {
            setTo(tx.to);
          }

          // NOTE: If we don't have a supplied gas limit, we don't need to set it.
          if (tx?.gasLimit) {
            setGasLimit(toHex(tx?.gasLimit?.toString()));
          }

          setReady(true);
          setNonce(tx.nonce ?? 0);
          setData(tx?.data);
          if (!isL2) {
            setTxType(GasFeeTypes.eip1559);
            if (tx.maxPriorityFeePerGas) {
              const hexMaxPriorityFeePerGas = toHex(tx.maxPriorityFeePerGas.toString());
              setMinMaxPriorityFeePerGas(calcGasParamRetryValue(hexMaxPriorityFeePerGas));
            }
            if (tx.maxFeePerGas) {
              const hexMaxFeePerGas = toHex(tx.maxFeePerGas.toString());
              setMinMaxFeePerGas(calcGasParamRetryValue(hexMaxFeePerGas));
            }
          } else {
            setTxType(GasFeeTypes.legacy);
            if (tx.gasPrice) {
              const hexGasPrice = toHex(tx.gasPrice.toString());
              setMinGasPrice(calcGasParamRetryValue(hexGasPrice));
            }
          }
        } catch (e) {
          logger.error(new RainbowError(`[SpeedUpAndCancelSheet]: error fetching tx info: ${e}`), {
            data: {
              tx,
            },
          });

          // NOTE: We don't care about this for cancellations
          if (type === SPEED_UP) {
            Alert.alert(lang.t('wallet.speed_up.unable_to_speed_up'), lang.t('wallet.speed_up.problem_while_fetching_transaction_data'), [
              {
                onPress: () => goBack(),
              },
            ]);
          }
        }
      }
    };

    init();
  }, [currentChainId, currentProvider, goBack, isL2, tx, tx?.gasLimit, tx.hash, type, updateGasFeeOption]);

  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed) && !calculatingGasLimit.current) {
      calculatingGasLimit.current = true;
      if (greaterThan(minMaxPriorityFeePerGas ?? 0, gasFeeParamsBySpeed?.fast?.maxPriorityFeePerGas?.amount)) {
        dispatch(updateGasFeeForSpeed(gasUtils.FAST, (minMaxPriorityFeePerGas || 0).toString()));
      }
      const gasLimitForNewTx = type === CANCEL_TX ? ethUnits.basic_tx : tx.gasLimit;
      updateTxFee(gasLimitForNewTx);
      calculatingGasLimit.current = false;
    }
  }, [dispatch, gasFeeParamsBySpeed, minMaxPriorityFeePerGas, tx, tx.gasLimit, type, updateTxFee]);

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
  }, [offset]);

  const sheetHeight = ios ? (type === CANCEL_TX ? 491 : 442) + safeAreaInsetValues.bottom : 850 + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + (type === CANCEL_TX ? 290 : 340) : null;

  const { colors, isDarkMode } = useTheme();

  const speeds = useMemo(() => {
    const defaultSpeeds: string[] = [URGENT];
    if (!isL2) {
      defaultSpeeds.push(CUSTOM);
    }
    return defaultSpeeds;
  }, [isL2]);

  return (
    <SheetKeyboardAnimation as={AnimatedContainer} isKeyboardVisible={false} translateY={offset}>
      <ExtendedSheetBackground />
      <SlackSheet backgroundColor={colors.transparent} borderRadius={0} height={sheetHeight} hideHandle scrollEnabled={false}>
        <Column>
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            paddingBottom={android ? 30 : 0}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Centered direction="column">
              {!ready ? (
                <Column align="center" backgroundColor={colors.white} height={300} justify="center" marginBottom={12} marginTop={30}>
                  <LoadingSpinner />
                </Column>
              ) : (
                <Fragment>
                  <Column marginBottom={12} marginTop={30}>
                    <Emoji name={type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'} size="biggest" />
                  </Column>
                  <Column marginBottom={12}>
                    <Text align="center" color={colors.dark} size="big" weight="heavy">
                      {title[type]}
                    </Text>
                  </Column>
                  <Column marginBottom={30} maxWidth={375} paddingHorizontal={42}>
                    <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.5)} lineHeight="looser" size="large" weight="regular">
                      {text[type]}
                    </Text>
                  </Column>
                  <Centered marginBottom={24}>
                    <Divider color={colors.rowDividerExtraLight} inset={[0, 143.5]} />
                  </Centered>
                  {type === CANCEL_TX && (
                    <Column marginBottom={android && 15}>
                      <SheetActionButtonRow ignorePaddingBottom ignorePaddingTop={ios}>
                        <SheetActionButton
                          color={colors.red}
                          label={`􀎽 ${lang.t('button.attempt_cancellation')}`}
                          onPress={handleCancellationWrapperFn}
                          size="big"
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                      <SheetActionButtonRow ignorePaddingBottom>
                        <SheetActionButton
                          color={colors.white}
                          label={lang.t('button.close')}
                          onPress={goBack}
                          size="big"
                          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                    </Column>
                  )}
                  {type === SPEED_UP && (
                    <SheetActionButtonRow ignorePaddingBottom={ios} ignorePaddingTop={ios}>
                      <SheetActionButton
                        color={colors.white}
                        label={lang.t('button.cancel')}
                        onPress={goBack}
                        size="big"
                        textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                        weight="bold"
                      />
                      <SheetActionButton
                        color={accentColor || colors.appleBlue}
                        label={`􀎽 ${lang.t('button.confirm')}`}
                        onPress={handleSpeedUpWrapperFn}
                        size="big"
                        weight="bold"
                      />
                    </SheetActionButtonRow>
                  )}
                  <GasSpeedButtonContainer>
                    <GasSpeedButton
                      asset={{ color: accentColor }}
                      chainId={currentChainId}
                      speeds={speeds}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                  </GasSpeedButtonContainer>
                </Fragment>
              )}
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
