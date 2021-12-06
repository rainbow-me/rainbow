import React from 'react';
import styled from 'styled-components';

export const HandleHeight = 5;

const defaultColor = (colors: any, showBlur: any) =>
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  android
    ? showBlur
      ? colors.alpha(colors.blueGreyDark, 0.3)
      : colors.blueGreyDark30
    : colors.alpha(colors.blueGreyDark30, showBlur ? 0.7 : 1.0);

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Handle = styled.View`
  background-color: ${({ color, theme: { colors }, showBlur }: any) =>
    color || defaultColor(colors, showBlur)};
  border-radius: 3;
  height: ${HandleHeight};
  overflow: hidden;
  width: 36;
  z-index: 9;
`;

export default function SheetHandle({ showBlur, ...props }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode } = useTheme();

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Handle {...props} isDarkMode={isDarkMode} showBlur={showBlur} />;
}
