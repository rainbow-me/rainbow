import PropTypes from 'prop-types';
import React from 'react';
import { useEmailRainbow } from '../../hooks';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Rounded } from '../text';

const NeedHelpButton = ({ subject, ...props }) => {
  const onEmailRainbow = useEmailRainbow({ subject });

  return (
    <ButtonPressAnimation onPress={onEmailRainbow} scaleTo={1.1}>
      <Centered
        backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
        borderRadius={15}
        css={padding(5, 10)}
        {...props}
      >
        <Rounded
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          letterSpacing={0.4}
          size="lmedium"
          weight="semibold"
        >
          Need help?
        </Rounded>
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
