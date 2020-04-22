import PropTypes from 'prop-types';
import React from 'react';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const ProfileAction = ({ icon, iconSize, onPress, text, ...props }) => (
  <ButtonPressAnimation onPress={onPress} {...props}>
    <RowWithMargins
      align="center"
      backgroundColor={colors.transparent}
      height={34}
      justify="flex-start"
      margin={6}
      paddingBottom={2}
    >
      <Icon
        color={colors.appleBlue}
        marginTop={0.5}
        name={icon}
        style={position.sizeAsObject(iconSize)}
      />
      <Text
        color="appleBlue"
        letterSpacing="roundedMedium"
        lineHeight={19}
        size="lmedium"
        weight="semibold"
      >
        {text}
      </Text>
    </RowWithMargins>
  </ButtonPressAnimation>
);

ProfileAction.propTypes = {
  icon: Icon.propTypes.name,
  iconSize: PropTypes.number,
  onPress: PropTypes.func,
  text: PropTypes.string,
};

ProfileAction.defaultProps = {
  iconSize: 16,
};

export default React.memo(ProfileAction);
