import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatURLForDisplay, magicMemo } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';
import styled from '@/styled-thing';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})({
  ...(android ? { paddingVertical: 10 } : { paddingTop: 14 }),
});

const Link = ({
  url,
  display,
  emoji,
  emojiName = 'compass',
  color,
  transformOrigin = 'left',
  scaleTo = 1.1,
  weight = 'semibold',
  ...props
}) => {
  const handlePress = useCallback(() => Linking.openURL(url), [url]);
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation compensateForTransformOrigin onPress={handlePress} scaleTo={scaleTo} transformOrigin={transformOrigin}>
      <Container {...props}>
        {!emoji && <Icon color={color || colors.appleBlue} name={emojiName} />}
        <Text color={color || colors.appleBlue} size="lmedium" weight={weight}>
          {emoji}
          {display || formatURLForDisplay(url)}
        </Text>
      </Container>
    </ButtonPressAnimation>
  );
};

export default magicMemo(Link, 'url');
