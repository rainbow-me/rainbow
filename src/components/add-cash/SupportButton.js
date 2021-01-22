import PropTypes from 'prop-types';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { colors_NOT_REACTIVE, padding } from '@rainbow-me/styles';

const SupportButton = ({ label, onPress, ...props }) => {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Centered
        backgroundColor={colors_NOT_REACTIVE.alpha(
          colors_NOT_REACTIVE.blueGreyDark,
          0.06
        )}
        borderRadius={15}
        css={padding(5, 10, 6)}
        {...props}
      >
        <Text
          align="center"
          color={colors_NOT_REACTIVE.alpha(
            colors_NOT_REACTIVE.blueGreyDark,
            0.6
          )}
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
