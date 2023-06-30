import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useBackgroundColor } from '@/design-system';

const PageElement = styled.View({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ color }) => color,
  paddingBottom: ({ bottomInset }) => bottomInset,
  paddingTop: ({ topInset }) => topInset,
});

const Page = ({ color, showBottomInset, showTopInset, ...props }, ref) => {
  const insets = useSafeAreaInsets();
  const bgColor = useBackgroundColor('surfacePrimary');

  return (
    <PageElement
      {...props}
      bottomInset={showBottomInset ? insets.bottom : 0}
      color={color || bgColor}
      ref={ref}
      topInset={showTopInset ? insets.top : 0}
    />
  );
};

export default React.forwardRef(Page);
