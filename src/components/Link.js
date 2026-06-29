import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import { openInBrowser } from '@/features/dapp-browser/utils/openInBrowser';
import styled from '@/framework/ui/styled-thing';
import formatURLForDisplay from '@/utils/formatURLForDisplay';
import magicMemo from '@/utils/magicMemo';

import { useTheme } from '../theme/ThemeContext';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})({
  ...(Platform.OS === 'android' ? { paddingVertical: 10 } : { paddingTop: 14 }),
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
  const handlePress = useCallback(() => openInBrowser(url), [url]);
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
