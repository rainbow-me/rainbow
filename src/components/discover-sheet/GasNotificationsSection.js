import messaging from '@react-native-firebase/messaging';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { Column, Row } from '../layout';
import { Emoji, Text } from '../text';
import { getLocal, saveLocal } from '@rainbow-me/handlers/localstorage/common';
import { useAccountSettings, useGas } from '@rainbow-me/hooks';
import { parseTxFees } from '@rainbow-me/parsers';
import { ethUnits } from '@rainbow-me/references';
import { position } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';
import ShadowStack from 'react-native-shadow-stack';

const Wrapper = styled.View`
  height: 70;
  margin-bottom: 20;
  margin-horizontal: 19;
`;

const Gradient = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: [colors.gasLeft, colors.gasRight],
  end: { x: 1, y: 0.5 },
  overflow: 'hidden',
  pointerEvents: 'none',
  start: { x: 0, y: 0.5 },
}))`
  ${position.coverAsObject}
  border-radius: 35;
  height: 70;
  position: absolute;
  z-index: 1;
`;

const Shadow = styled(ShadowStack).attrs(({ theme: { colors } }) => ({
  backgroundColor: colors.white,
  borderRadius: 35,
}))`
  height: 70;
`;

const TOPIC = 'GAS_FEE';
const TOPIC_DEV = 'GAS_FEE_DEV';
const IS_SUBSCRIBED = 'IS-SUBSCRIBED-LOW-FEE';

const GasNotification = () => {
  const [isSubscribed, setIsSubscibed] = useState(false);

  useEffect(() => {
    getLocal(IS_SUBSCRIBED).then(({ value }) => {
      if (value !== null) {
        setIsSubscibed(value);
      }
    });
  }, []);

  const { nativeCurrency } = useAccountSettings();

  const { colors, isDarkMode } = useTheme();

  const CardShadow = useMemo(
    () => [[0, 8, 24, isDarkMode ? colors.shadow : colors.gasRight, 0.35]],
    [colors.gasRight, colors.shadow, isDarkMode]
  );

  const { gasPrices, startPollingGasPrices, stopPollingGasPrices } = useGas();
  useEffect(() => {
    startPollingGasPrices();
    return stopPollingGasPrices;
  }, [startPollingGasPrices, stopPollingGasPrices]);

  const ethPriceUnit = ethereumUtils.getEthPriceUnit();

  const { normal: nativeNormal } = useMemo(
    () =>
      parseTxFees(gasPrices, ethPriceUnit, ethUnits.basic_tx, nativeCurrency),
    [ethPriceUnit, gasPrices, nativeCurrency]
  );

  const value = nativeNormal?.txFee?.native?.value?.display;

  const toggleSwitch = useCallback(async value => {
    setIsSubscibed(value);
    try {
      const fun = value
        ? messaging().subscribeToTopic
        : messaging().unsubscribeFromTopic;
      await fun(TOPIC);
      if (__DEV__) {
        await fun(TOPIC_DEV);
      }
    } catch (e) {
      logger.sentry('Error toggling gas fee subscription', e);
    }

    saveLocal(IS_SUBSCRIBED, { value });
  }, []);

  return (
    <Wrapper>
      <Shadow shadows={CardShadow} />
      <Gradient />
      <Row
        flex={1}
        justifyContent="space=between"
        position="absolute"
        width="100%"
        zIndex={1}
      >
        <Column height={50} marginLeft={20} marginVertical={15} width={50}>
          <Emoji size={35}>🔔</Emoji>
        </Column>
        <Column flex={1} marginLeft={0} marginTop={ios ? 13.5 : 6}>
          <Text color={colors.darkGrey} size="large" weight="heavy">
            Low fee alert
          </Text>
          {value !== '$NaN' && (
            <Text
              color={colors.darkGrey}
              size="lmedium"
              style={ios ? {} : { marginTop: -10 }}
              weight="semibold"
            >
              Currently {value} to transfer
            </Text>
          )}
        </Column>
        <Column
          alignItems="center"
          justifyContent="center"
          marginRight={20}
          marginTop={18}
        >
          <Switch onValueChange={toggleSwitch} value={isSubscribed} />
        </Column>
      </Row>
    </Wrapper>
  );
};

export default GasNotification;
