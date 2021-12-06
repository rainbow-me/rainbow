import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import { magicMemo } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';

const formatURLForDisplay = (url: any) => {
  const pretty = url.split('://')[1].replace('www.', '');
  return pretty.charAt(pretty.length - 1) === '/'
    ? pretty.substring(0, pretty.length - 1)
    : pretty;
};

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? 'padding-vertical: 10' : 'padding-top: 14'};
`;

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
}: any) => {
  const handlePress = useCallback(() => Linking.openURL(url), [url]);
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      compensateForTransformOrigin
      onPress={handlePress}
      scaleTo={scaleTo}
      transformOrigin={transformOrigin}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container {...props}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {!emoji && <Icon color={color || colors.appleBlue} name={emojiName} />}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text color={color || colors.appleBlue} size="lmedium" weight={weight}>
          {emoji}
          {display || formatURLForDisplay(url)}
        </Text>
      </Container>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(Link, 'url');
