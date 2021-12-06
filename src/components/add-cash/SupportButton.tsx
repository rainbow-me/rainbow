import PropTypes from 'prop-types';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const SupportButton = ({ label, onPress, ...props }: any) => {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered
        backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
        borderRadius={15}
        css={padding(5, 10, 6)}
        {...props}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
