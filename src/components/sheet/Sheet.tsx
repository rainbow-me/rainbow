import PropTypes from 'prop-types';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';

// @ts-expect-error ts-migrate(6142) FIXME: Module '../TouchableBackdrop' was resolved to '/Us... Remove this comment to see the full error message
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SheetHandle' was resolved to '/Users/nic... Remove this comment to see the full error message
import SheetHandle from './SheetHandle';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';

const Sheet = ({
  borderRadius,
  children,
  hideHandle,
  noInsets,
  paddingBottom = 7,
  paddingTop = 6,
}: any) => {
  const { width } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeArea();
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column height="100%" justify="end" width={width}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableBackdrop onPress={goBack} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column
        backgroundColor={colors.white}
        css={borders.buildRadius('top', borderRadius)}
        paddingBottom={noInsets ? 0 : insets.bottom}
        width="100%"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered paddingBottom={paddingBottom} paddingTop={paddingTop}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {!hideHandle && <SheetHandle />}
        </Centered>
        {children}
      </Column>
    </Column>
  );
};

Sheet.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  hideHandle: PropTypes.bool,
};

Sheet.defaultProps = {
  borderRadius: 39,
};

export default Sheet;
