import { BlurView } from '@react-native-community/blur';
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { padding, position } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const Container = styled(Centered).attrs({
  flex: android ? 1 : undefined,
  self: android ? 'center' : undefined,
})`
  ${position.size('100%')};
  position: absolute;
  z-index: 999;
`;

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)};
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: ${20};
  overflow: hidden;
`;

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 40,
  blurType: isDarkMode ? 'dark' : 'light',
}))`
  ${position.cover};
  z-index: 1;
`;

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  lineHeight: ios ? 'none' : '24px',
  size: 'large',
  weight: 'semibold',
}))`
  margin-left: 8;
`;

const LoadingOverlay = ({ title, ...props }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <Container {...props} as={android ? Column : TouchableBackdrop} disabled>
      <Overlay>
        <Centered zIndex={2}>
          {android ? (
            <Spinner color={colors.blueGreyDark} />
          ) : (
            <ActivityIndicator />
          )}
          {title ? <Title>{title}</Title> : null}
        </Centered>
        <OverlayBlur isDarkMode={isDarkMode} />
      </Overlay>
    </Container>
  );
};

export default neverRerender(LoadingOverlay);
