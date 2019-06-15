import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { withNeverRerender } from '../../hoc';
import { colors, padding, position } from '../../styles';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';

const ModalFooterButton = ({ icon, label, onPress }) => (
  <RowWithMargins
    align="center"
    component={BorderlessButton}
    css={padding(0, 25)}
    flex={0}
    height={56}
    justify="center"
    margin={7}
    onPress={onPress}
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
);

ModalFooterButton.propTypes = {
  icon: Icon.propTypes.name,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default withNeverRerender(ModalFooterButton);
