import PropTypes from 'prop-types';
import React from 'react';
import { useEmailRainbow } from '../../hooks';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';

const NeedHelpButton = ({ subject, ...props }) => {
  const onEmailRainbow = useEmailRainbow({ subject });

  return (
    <ButtonPressAnimation onPress={onEmailRainbow} scaleTo={0.9}>
      <Centered
        backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
        borderRadius={15}
        css={padding(5, 10, 6)}
        {...props}
      >
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          Need help?
        </Text>
      </Centered>
    </ButtonPressAnimation>
  );
};

NeedHelpButton.propTypes = {
  subject: PropTypes.string,
};

NeedHelpButton.defaultProps = {
  subject: 'support',
};

export default React.memo(NeedHelpButton);
