import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { lightModeThemeColors } from '../../styles/colors';
import { magicMemo } from '../../utils';
import { Text } from '../text';
import FloatingActionButton from './FloatingActionButton';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.6],
  [0, 5, 15, lightModeThemeColors.blueGreyDark, 1],
];

const SearchFab = ({ disabled, ...props }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={isDarkMode ? colors.darkModeDark : colors.blueGreyDark}
      disabled={disabled}
      shadows={FabShadow}
      testID="search-fab"
    >
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

export default magicMemo(SearchFab, ['disabled']);
