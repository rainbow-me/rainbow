import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { neverRerender } from '@/utils';

const Container = styled(Centered).attrs({
  flex: android ? 1 : undefined,
  self: android ? 'center' : undefined,
})({
  ...position.sizeAsObject('100%'),
  position: 'absolute',
  zIndex: 999,
});

const Overlay = styled(Centered)({
  ...padding.object(19, 19, 22),
  backgroundColor: ({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.15),
  borderRadius: 20,
  overflow: 'hidden',
});

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 40,
  blurType: isDarkMode ? 'dark' : 'light',
}))({
  ...position.coverAsObject,
  zIndex: 1,
});

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  lineHeight: ios ? 'none' : 24,
  size: 'large',
  weight: 'semibold',
}))({
  marginLeft: 8,
});

const LoadingOverlay = ({ title, ...props }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <Container {...props} as={android ? Column : TouchableBackdrop} disabled>
      <Overlay>
        <Centered zIndex={2}>
          {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator />}
          {title ? <Title>{title}</Title> : null}
        </Centered>
        <OverlayBlur isDarkMode={isDarkMode} />
      </Overlay>
    </Container>
  );
};

export default neverRerender(LoadingOverlay);
