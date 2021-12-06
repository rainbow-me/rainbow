import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const PageElement = styled.View`
  ${position.size('100%')};
  background-color: ${({ color }: any) => color};
  padding-bottom: ${({ bottomInset }: any) => bottomInset};
  padding-top: ${({ topInset }: any) => topInset};
`;

const Page = (
  { color, showBottomInset, showTopInset, ...props }: any,
  ref: any
) => {
  const insets = useSafeArea();
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <PageElement
      {...props}
      bottomInset={showBottomInset ? insets.bottom : 0}
      color={color || colors.white}
      ref={ref}
      topInset={showTopInset ? insets.top : 0}
    />
  );
};

export default React.forwardRef(Page);
