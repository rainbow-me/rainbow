import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const PageElement = styled.View({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ color }) => color,
  paddingBottom: ({ bottomInset }) => bottomInset,
  paddingTop: ({ topInset }) => topInset,
});

const Page = ({ color, showBottomInset, showTopInset, ...props }, ref) => {
  const insets = useSafeArea();
  const { colors } = useTheme();
  return (
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
