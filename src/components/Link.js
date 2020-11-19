import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import { magicMemo } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';
import { colors } from '@rainbow-me/styles';

const formatURLForDisplay = url => {
  const pretty = url.split('://')[1].replace('www.', '');
  return pretty.charAt(pretty.length - 1) === '/'
    ? pretty.substring(0, pretty.length - 1)
    : pretty;
};

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${android ? 'padding-vertical: 10' : 'padding-top: 14'};
`;

const Link = ({ url }) => {
  const handlePress = useCallback(() => Linking.openURL(url), [url]);

  return (
    <ButtonPressAnimation
      compensateForTransformOrigin
      onPress={handlePress}
      scaleTo={1.1}
      transformOrigin="left"
    >
      <Container>
        <Icon color={colors.appleBlue} name="compass" />
        <Text color={colors.appleBlue} size="lmedium" weight="semibold">
          {formatURLForDisplay(url)}
        </Text>
      </Container>
    </ButtonPressAnimation>
  );
};

export default magicMemo(Link, 'url');
