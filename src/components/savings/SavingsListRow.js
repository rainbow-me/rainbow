import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { colors, padding, position, fonts } from '../../styles';
import { Centered, Row } from '../layout';
import LinearGradient from 'react-native-linear-gradient';
import { ShadowStack } from '../shadow-stack';
import { deviceUtils } from '../../utils';
import { GradientText, Text } from '../text';
import { Icon } from '../icons';
import { ButtonPressAnimation } from '../animations';
import { compose, withHandlers } from 'recompact';
import { withNavigation } from 'react-navigation';
import { CoinIcon } from '../coin-icon';
import AnimatedChangeText from '../text/AnimatedGradientText';

const SavingsListRow = ({ APY, currency, value, onPress }) => {
  const [curValue, setCurValue] = useState(value);

  useEffect(() => {
    // all useEffect is dummy data changes injection to see change digits animation
    let nextValue = String(Number(curValue) + Math.random() * Math.random());

    if (nextValue < 100) {
      nextValue = Number(nextValue).toFixed(3);
    }

    setTimeout(() => {
      setCurValue(nextValue);
    }, 4000);
  }, [curValue]);

  return (
    <Centered css={padding(9, 0, 3)} direction="column">
      <ShadowStack
        height={50}
        width={deviceUtils.dimensions.width - 18}
        borderRadius={25}
        shadows={[
          [0, 10, 30, colors.dark, 0.1],
          [0, 5, 15, colors.dark, 0.04],
        ]}
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
            {currency ? (
              <CoinIcon
                symbol={currency}
                size={26}
                style={{ marginRight: 7 }}
              />
            ) : null}
            {value ? (
              <AnimatedChangeText value={curValue} />
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
                    <Icon name="plusCircled" color={colors.white} height={16} />
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
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0, y: 0 }}
              opacity={0.12}
              style={position.coverAsObject}
            />
            <GradientText
              end={{ x: 0.92, y: 0.5 }}
              style={{
                fontSize: 16,
                fontWeight: fonts.weight.semibold,
                paddingHorizontal: 10,
              }}
            >
              {String(APY)}% APY
            </GradientText>
          </Centered>
        </Row>
      </ShadowStack>
    </Centered>
  );
};

SavingsListRow.height = 61;

SavingsListRow.propTypes = {
  APY: PropTypes.string,
  currency: PropTypes.string,
  onPress: PropTypes.func,
  value: PropTypes.number,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('SavingsSheet'),
  })
)(SavingsListRow);
