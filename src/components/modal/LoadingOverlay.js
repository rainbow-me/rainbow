import React from 'react';
import { BlurView } from 'react-native-blur-view';
import { useTheme } from '../../theme/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { IS_ANDROID, IS_IOS } from '@/env';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { neverRerender } from '@/utils';

const Container = styled(Centered).attrs({
  flex: IS_ANDROID ? 1 : undefined,
  self: IS_ANDROID ? 'center' : undefined,
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
  blurIntensity: 40,
  blurStyle: isDarkMode ? 'dark' : 'light',
}))({
  ...position.coverAsObject,
  zIndex: 1,
});

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  lineHeight: IS_IOS ? 'none' : 24,
  size: 'large',
  weight: 'semibold',
}))({
  marginLeft: 8,
});

const LoadingOverlay = ({ title, ...props }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <Container {...props} as={IS_ANDROID ? Column : TouchableBackdrop} disabled>
      <Overlay>
        <Centered zIndex={2}>
          {IS_ANDROID ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator />}
          {title ? <Title>{title}</Title> : null}
        </Centered>
        <OverlayBlur isDarkMode={isDarkMode} />
      </Overlay>
    </Container>
  );
};

export default neverRerender(LoadingOverlay);
