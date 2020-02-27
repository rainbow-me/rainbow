import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import LinearGradient from 'react-native-linear-gradient';
import { withNavigation } from 'react-navigation';
import {
  convertAmountToPercentageDisplay,
  multiply,
} from '../../helpers/utilities';
import { colors, padding, position, fonts } from '../../styles';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { GradientText, Text } from '../text';

const SavingsListRow = ({
  onPress,
  supplyBalanceUnderlying,
  supplyRate,
  underlying,
}) => {
  const something = multiply(supplyRate, 100);
  console.log('SOMETHING', something, supplyRate);

  return (
    <Centered css={padding(9, 0, 3)} direction="column">
      <ShadowStack
        height={50}
        width={deviceUtils.dimensions.width - 18}
        borderRadius={25}
        shadows={[
          [0, 3, 5, colors.dark, 0.2],
          [0, 6, 10, colors.dark, 0.14],
        ]}
      >
        <ButtonPressAnimation
          onPress={onPress}
          scaleTo={supplyBalanceUnderlying ? 0.92 : 1}
        >
          <Row
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              marginLeft: 5,
              padding: 10,
            }}
          >
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {underlying.symbol ? (
                <CoinIcon
                  symbol={underlying.symbol}
                  size={26}
                  style={{ marginRight: 7 }}
                />
              ) : null}
              {supplyBalanceUnderlying ? (
                <GradientText
                  colors={['#000000', '#2CCC00']}
                  steps={[0.6, 1]}
                  end={{ x: 0.9, y: 0.5 }}
                  style={{
                    color: colors.blueGreyDark,
                    fontSize: 16,
                    fontWeight: fonts.weight.semibold,
                    marginRight: 10,
                  }}
                >
                  ${Number(supplyBalanceUnderlying)}
                </GradientText>
              ) : (
                <>
                  <Text
                    style={{
                      color: colors.blueGreyDark,
                      fontSize: 16,
                      fontWeight: fonts.weight.semibold,
                      marginRight: 10,
                      opacity: 0.5,
                    }}
                  >
                    $0.00
                  </Text>
                  <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
                    <ShadowStack
                      width={97}
                      height={30}
                      borderRadius={25}
                      paddingHorizontal={8}
                      backgroundColor="#575CFF"
                      alignItems="center"
                      flexDirection="row"
                      shadows={[
                        [0, 3, 5, colors.dark, 0.2],
                        [0, 6, 10, colors.dark, 0.14],
                      ]}
                    >
                      <Icon
                        name="plusCircled"
                        color={colors.white}
                        height={16}
                      />
                      <Text
                        style={{
                          color: colors.white,
                          fontSize: 15,
                          fontWeight: fonts.weight.semibold,
                          marginLeft: -7.5,
                          paddingHorizontal: 10,
                        }}
                      >
                        Deposit
                      </Text>
                    </ShadowStack>
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
                opacity={0.12}
                style={position.coverAsObject}
              />
              <GradientText
                style={{
                  fontSize: 16,
                  fontWeight: fonts.weight.semibold,
                  paddingHorizontal: 10,
                }}
              >
                {convertAmountToPercentageDisplay(multiply(supplyRate, 100))}{' '}
                APY
              </GradientText>
            </Centered>
          </Row>
        </ButtonPressAnimation>
      </ShadowStack>
    </Centered>
  );
};

SavingsListRow.propTypes = {
  onPress: PropTypes.func,
  supplyBalanceUnderlying: PropTypes.number,
  supplyRate: PropTypes.string,
  underlying: PropTypes.object,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({
      navigation,
      supplyRate,
      lifetimeSupplyInterestAccrued,
      underlying,
      supplyBalanceUnderlying,
    }) => () => {
      navigation.navigate('SavingsSheet', {
        isEmpty: !supplyBalanceUnderlying,
        lifetimeSupplyInterestAccrued,
        supplyBalanceUnderlying,
        supplyRate,
        underlying,
      });
    },
  })
)(SavingsListRow);
