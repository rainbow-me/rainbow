import PropTypes from 'prop-types';
import React from 'react';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Rounded } from '../text';

const ProfileAction = ({ icon, iconSize, onPress, text, ...props }) => (
  <ButtonPressAnimation onPress={onPress} {...props}>
    <RowWithMargins
      align="center"
      backgroundColor={colors.transparent}
      css={padding(8, 9)}
      margin={6}
    >
      <Icon
        color={colors.appleBlue}
        name={icon}
        style={position.sizeAsObject(iconSize)}
      />
      <Rounded
        color="appleBlue"
        letterSpacing="looseyGoosey"
        lineHeight={19}
        size="lmedium"
        weight="semibold"
      >
        {text}
      </Rounded>
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
