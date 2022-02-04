import PropTypes from 'prop-types';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const centerStyles = padding.object(5, 10, 6);

const SupportButton = ({ label, onPress, ...props }) => {
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Centered
        backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
        borderRadius={15}
        style={centerStyles}
        {...props}
      >
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          {label}
        </Text>
      </Centered>
    </ButtonPressAnimation>
  );
};

SupportButton.propTypes = {
  label: PropTypes.string,
  onPress: PropTypes.func,
};

export default React.memo(SupportButton);
