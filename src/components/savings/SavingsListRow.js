import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Platform, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  calculateAPY,
  calculateCompoundInterestInDays,
  formatSavingsAmount,
} from '../../helpers/savings';
import { colors, position, fonts } from '../../styles';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation, AnimatedNumber } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, Row, InnerBorder } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { GradientText, Text } from '../text';
import { useNavigation } from 'react-navigation-hooks';

const MS_IN_1_DAY = 1000 * 60 * 60 * 24;
const ANIMATE_NUMBER_INTERVAL = 30;
const STABLECOINS = ['DAI', 'SAI', 'USDC', 'USDT'];

const sx = StyleSheet.create({
  animatedNumberAndroid: {
    height: 40,
    paddingLeft: 35,
    position: 'absolute',
  },
  text: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: fonts.weight.bold,
    marginBottom: 0.5,
    marginRight: 4,
    textAlign: 'left',
  },
});

const animatedNumberFormatter = (val, symbol) => {
  const isStablecoin = STABLECOINS.indexOf(symbol) !== -1;
  if (isStablecoin) {
    return `$${formatSavingsAmount(val)}`;
  }
  return `${formatSavingsAmount(val)} ${symbol}`;
};

const renderAnimatedNumber = (value, steps, symbol) => {
  return (
    <AnimatedNumber
      letterSpacing={parseFloat(fonts.letterSpacing.roundedTightest)}
      style={[
        sx.text,
        Platform.OS === 'android' ? sx.animatedNumberAndroid : null,
      ]}
      formatter={val => animatedNumberFormatter(val, symbol)}
      steps={steps}
      time={ANIMATE_NUMBER_INTERVAL}
      value={Number(value)}
    />
  );
};

const SavingsListRow = ({
  cTokenBalance,
  lifetimeSupplyInterestAccrued,
  lifetimeSupplyInterestAccruedNative,
  nativeValue,
  supplyBalanceUnderlying,
  supplyRate,
  underlying,
  underlyingPrice,
}) => {
  const initialValue = supplyBalanceUnderlying;
  const [value, setValue] = useState(initialValue);
  const [steps, setSteps] = useState(0);
  const apy = useMemo(() => calculateAPY(supplyRate), [supplyRate]);
  const apyTruncated = supplyBalanceUnderlying
    ? parseFloat(apy).toFixed(2)
    : Math.floor(apy * 10) / 10;
  const { navigate } = useNavigation();

  const onButtonPress = useCallback(() => {
    navigate('SavingsSheet', {
      cTokenBalance,
      isEmpty: !supplyBalanceUnderlying,
      lifetimeSupplyInterestAccrued,
      lifetimeSupplyInterestAccruedNative,
      nativeValue,
      supplyBalanceUnderlying,
      supplyRate,
      underlying,
      underlyingPrice,
    });
  }, [
    cTokenBalance,
    lifetimeSupplyInterestAccrued,
    lifetimeSupplyInterestAccruedNative,
    nativeValue,
    navigate,
    supplyBalanceUnderlying,
    supplyRate,
    underlying,
    underlyingPrice,
  ]);

  useEffect(() => {
    const getFutureValue = () => {
      if (!supplyBalanceUnderlying) return;
      const futureValue = calculateCompoundInterestInDays(
        initialValue,
        supplyRate,
        1
      );

      if (!BigNumber(futureValue).eq(value)) {
        const steps = MS_IN_1_DAY / ANIMATE_NUMBER_INTERVAL;
        setValue(futureValue);
        setSteps(steps);
      }
    };
    getFutureValue();
  }, [
    apy,
    initialValue,
    supplyBalanceUnderlying,
    supplyRate,
    underlying,
    value,
  ]);

  const displayValue = formatSavingsAmount(value);
  if (!underlying || !underlying.address) return null;

  return (
    <ButtonPressAnimation onPress={onButtonPress} scaleTo={0.96}>
      <Centered direction="column" marginBottom={15}>
        <ShadowStack
          height={49}
          width={deviceUtils.dimensions.width - 38}
          borderRadius={49}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
          style={{ elevation: 15 }}
        >
          <LinearGradient
            borderRadius={49}
            colors={['#FFFFFF', '#F7F9FA']}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            opacity={0.1}
            style={position.coverAsObject}
          />
          <Row
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              marginLeft: 0,
              paddingBottom: 10,
              paddingLeft: 11,
              paddingRight: 10,
              paddingTop: 9,
            }}
          >
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {underlying.symbol && supplyBalanceUnderlying ? (
                <CoinIcon
                  symbol={underlying.symbol}
                  size={26}
                  style={{ marginRight: 6 }}
                />
              ) : null}
              {supplyBalanceUnderlying && !isNaN(displayValue) ? (
                renderAnimatedNumber(displayValue, steps, underlying.symbol)
              ) : (
                <>
                  <Text
                    style={{
                      color: colors.alpha(colors.blueGreyDark, 0.5),
                      fontSize: 16,
                      fontWeight: fonts.weight.bold,
                      letterSpacing: fonts.letterSpacing.roundedTightest,
                      marginLeft: 4,
                      marginRight: 8,
                    }}
                  >
                    $0.00
                  </Text>
                  <ButtonPressAnimation
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={colors.swapPurple}
                    borderRadius={15}
                    flexDirection="row"
                    justify="space-around"
                    height={30}
                    onPress={onButtonPress}
                    paddingRight={2}
                    scaleTo={0.92}
                    shadowColor={colors.swapPurple}
                    shadowOffset={{ height: 4, width: 0 }}
                    shadowOpacity={0.4}
                    shadowRadius={6}
                    width={97}
                  >
                    {/*
                      <Icon
                        name="plusCircled"
                        color={colors.white}
                        height={16}
                        marginBottom={1}
                        marginRight={3.5}
                      />
                    */}
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: parseFloat(fonts.size.lmedium),
                        fontWeight: fonts.weight.semibold,
                        letterSpacing: fonts.letterSpacing.roundedTight,
                        marginBottom: 1,
                      }}
                    >
                      􀁍 Deposit
                    </Text>
                    <InnerBorder radius={15} />
                  </ButtonPressAnimation>
                </>
              )}
            </Row>
            <Centered
              style={{
                height: 30,
              }}
            >
              <LinearGradient
                borderRadius={17}
                overflow="hidden"
                colors={['#2CCC00', '#FEBE44']}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
                start={{ x: 0, y: 0 }}
                opacity={0.1}
                style={position.coverAsObject}
              />
              <GradientText
                align="center"
                angle={0}
                end={{ x: 1, y: 1 }}
                letterSpacing="roundedTight"
                start={{ x: 0, y: 0 }}
                steps={[0, 1]}
                style={{
                  fontSize: parseFloat(fonts.size.lmedium),
                  fontWeight: fonts.weight.semibold,
                  paddingBottom: 1,
                  paddingHorizontal: 10,
                }}
              >
                {apyTruncated}% APY
              </GradientText>
            </Centered>
          </Row>
        </ShadowStack>
      </Centered>
    </ButtonPressAnimation>
  );
};

SavingsListRow.propTypes = {
  cTokenBalance: PropTypes.string,
  lifetimeSupplyInterestAccrued: PropTypes.string,
  nativeValue: PropTypes.number,
  supplyBalanceUnderlying: PropTypes.string,
  supplyRate: PropTypes.string,
  underlying: PropTypes.object,
  underlyingPrice: PropTypes.string,
};

export default SavingsListRow;
