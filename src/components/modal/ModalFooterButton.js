import PropTypes from 'prop-types';
import React from 'react';
import { withNeverRerender } from '../../hoc';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';

const ModalFooterButtonHeight = 56;

const ModalFooterButton = withNeverRerender(({ icon, label, onPress }) => (
  <ButtonPressAnimation
    activeOpacity={0.666}
    onPress={onPress}
    scaleTo={0.86}
  >
    <RowWithMargins
      align="center"
      css={padding(0, 25, 2)}
      flex={0}
      height={ModalFooterButtonHeight}
      justify="center"
      margin={7}
    >
      <Centered css={position.size(18)} flex={0}>
        <Icon
          color={colors.paleBlue}
          css={position.maxSize('100%')}
          name={icon}
        />
      </Centered>
      <Text
        color="white"
        letterSpacing="tight"
        size="large"
        weight="medium"
      >
        {label}
      </Text>
    </RowWithMargins>
  </ButtonPressAnimation>
));

ModalFooterButton.propTypes = {
  icon: Icon.propTypes.name,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

ModalFooterButton.height = ModalFooterButtonHeight;

export default ModalFooterButton;
