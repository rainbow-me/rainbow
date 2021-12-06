import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { lightModeThemeColors } from '../../styles/colors';
import { magicMemo } from '../../utils';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingActionButton' was resolved to '/... Remove this comment to see the full error message
import FloatingActionButton from './FloatingActionButton';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.6],
  [0, 5, 15, lightModeThemeColors.blueGreyDark, 1],
];

const SearchFab = ({ disabled, ...props }: any) => {
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingActionButton
      {...props}
      backgroundColor={isDarkMode ? colors.darkModeDark : colors.blueGreyDark}
      disabled={disabled}
      shadows={FabShadow}
      testID="search-fab"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        align="center"
        color="whiteLabel"
        lineHeight={25}
        size="big"
        weight="bold"
      >
        􀊫
      </Text>
    </FloatingActionButton>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(SearchFab, ['disabled']);
