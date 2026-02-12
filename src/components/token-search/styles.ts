import { opacity } from '@/framework/ui/utils/opacity';

export const getTokenSearchButtonWrapperStyle = ({
  color,
  isDarkMode,
  pasteMode = false,
}: {
  color: string;
  isDarkMode: boolean;
  pasteMode?: boolean;
}) => {
  'worklet';

  const darkModeBorderOpacity = pasteMode ? 0.08 : 0.06;
  const lightModeBorderOpacity = pasteMode ? 0.06 : 0.01;

  return {
    backgroundColor: pasteMode ? 'transparent' : opacity(color, isDarkMode ? 0.1 : 0.08),
    borderColor: opacity(color, isDarkMode ? darkModeBorderOpacity : lightModeBorderOpacity),
  };
};
