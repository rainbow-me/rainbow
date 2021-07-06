import { toLower } from 'lodash';

export default function useColorOverrides(color) {
  const { colors, isDarkMode } = useTheme();
  // This is the color that ETH uses, which looks bad
  // since it makes the buttons look disabled
  if (isDarkMode && toLower(color) === '#737e8d') {
    return colors.appleBlue;
  }
  return color;
}
