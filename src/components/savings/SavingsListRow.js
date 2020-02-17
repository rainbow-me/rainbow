import PropTypes from 'prop-types';
import React from 'react';
import { colors, padding, position, fonts } from '../../styles';
import { Centered } from '../layout';
import LinearGradient from 'react-native-linear-gradient';
import { View } from 'react-native';
import { ShadowStack } from '../shadow-stack';
import { deviceUtils } from '../../utils';
import { GradientText, Text } from '../text';
import { Icon } from '../icons';
import { ButtonPressAnimation } from '../animations';
import { compose, withHandlers } from 'recompact';
import { withNavigation } from 'react-navigation';

const SavingsSheetHeader = ({ APY, onPress }) => (
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
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginLeft: 5,
          padding: 10,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: fonts.weight.semibold,
              marginRight: 10,
              opacity: 0.5,
            }}
          >
            $0.00
          </Text>
          <ButtonPressAnimation onPress={onPress}>
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
        </View>
        <View
          style={{
            alignItems: 'center',
            height: 30,
            justifyContent: 'center',
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
            {APY} APY
          </GradientText>
        </View>
      </View>
    </ShadowStack>
  </Centered>
);

SavingsSheetHeader.propTypes = {
  APY: PropTypes.string,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('SavingsSheet'),
  })
)(SavingsSheetHeader);
