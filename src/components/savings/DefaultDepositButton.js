import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const DefaultDepositButton = ({ onButtonPress }) => (
  <Fragment>
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
    <ButtonPressAnimation onPress={onButtonPress} scaleTo={0.92}>
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
  </Fragment>
);

DefaultDepositButton.propTypes = {
  onButtonPress: PropTypes.func,
};

export default DefaultDepositButton;
