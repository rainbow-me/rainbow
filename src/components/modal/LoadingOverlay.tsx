import { BlurView } from '@react-native-community/blur';
import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../ActivityIndicator' was resolved to '/Us... Remove this comment to see the full error message
import ActivityIndicator from '../ActivityIndicator';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TouchableBackdrop' was resolved to '/Us... Remove this comment to see the full error message
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { neverRerender } from '@rainbow-me/utils';

const Container = styled(Centered).attrs({
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  flex: android ? 1 : undefined,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  self: android ? 'center' : undefined,
})`
  ${position.size('100%')};
  position: absolute;
  z-index: 999;
`;

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)};
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: ${20};
  overflow: hidden;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isDarkMode' does not exist on type 'Blur... Remove this comment to see the full error message
const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 40,
  blurType: isDarkMode ? 'dark' : 'light',
}))`
  ${position.cover};
  z-index: 1;
`;

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  lineHeight: ios ? 'none' : '24px',
  size: 'large',
  weight: 'semibold',
}))`
  margin-left: 8;
`;

const LoadingOverlay = ({ title, ...props }: any) => {
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props} as={android ? Column : TouchableBackdrop} disabled>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Overlay>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered zIndex={2}>
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
          'android'.
          {android ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Spinner color={colors.blueGreyDark} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ActivityIndicator />
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {title ? <Title>{title}</Title> : null}
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <OverlayBlur isDarkMode={isDarkMode} />
      </Overlay>
    </Container>
  );
};

export default neverRerender(LoadingOverlay);
