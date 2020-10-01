import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { colors, position } from '@rainbow-me/styles';

const PageElement = styled.View`
  ${position.size('100%')};
  background-color: ${({ color }) => color};
  padding-bottom: ${({ bottomInset }) => bottomInset};
  padding-top: ${({ topInset }) => topInset};
`;

const Page = (
  { color = colors.white, showBottomInset, showTopInset, ...props },
  ref
) => {
  const insets = useSafeArea();
  return (
    <PageElement
      {...props}
      bottomInset={showBottomInset ? insets.bottom : 0}
      color={color}
      ref={ref}
      topInset={showTopInset ? insets.top : 0}
    />
  );
};

export default React.forwardRef(Page);
