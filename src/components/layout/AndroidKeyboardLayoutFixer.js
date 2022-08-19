import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useDimensions } from '../../hooks';
import { useKeyboardMaxArea } from '@/hooks/useKeyboardArea';
import styled from '@rainbow-me/styled-components';

const Container = styled.View({
  flex: 1,
  justifyContent: 'flex-end',
  marginBottom: ({ marginBottom }) => (marginBottom < 0 ? marginBottom : 0),
});

const Wrapper = styled.View({
  flex: 1,
  marginTop: ({ insets }) => insets.top,
});

export default function AndroidKeyboardLayoutFixer({ ...props }) {
  const insets = useSafeArea();
  const keyboardHeight = useKeyboardMaxArea();
  const dimensions = useDimensions();

  const [maxHeight, setMaxHeight] = useState(0);

  const handleLayout = useCallback(evt => {
    setMaxHeight(prev => {
      return evt.nativeEvent?.layout.height > prev
        ? evt.nativeEvent?.layout.height
        : prev;
    });
  }, []);

  const marginBottom =
    dimensions.height - keyboardHeight - maxHeight - insets.top;

  return (
    <Wrapper insets={insets}>
      <Container marginBottom={marginBottom}>
        <View onLayout={handleLayout} {...props} />
      </Container>

      <View style={{ height: keyboardHeight }} />
    </Wrapper>
  );
}
