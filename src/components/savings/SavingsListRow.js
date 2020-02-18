import PropTypes from 'prop-types';
import React from 'react';
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

const SavingsSheetHeader = ({ APY, currency, value, onPress }) => (
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
            <CoinIcon symbol={currency} size={26} style={{ marginRight: 7 }} />
          ) : null}
          {value ? (
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
              ${Number(value)}
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
            {String(APY)}% APY
          </GradientText>
        </Centered>
      </Row>
    </ShadowStack>
  </Centered>
);

SavingsSheetHeader.propTypes = {
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
)(SavingsSheetHeader);
