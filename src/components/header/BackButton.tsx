import React, { useCallback } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../icons/Icon' was resolved to '/Users/nic... Remove this comment to see the full error message
import Icon from '../icons/Icon';
import { Row } from '../layout';
import Text from '../text/Text';
import HeaderButton from './HeaderButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const Container = styled(Row).attrs({ align: 'center' })`
  height: 44;
  width: ${({ textChevron }) => (textChevron ? 20 : 10)};
`;

const IconText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'big',
}))`
  ${fontWithWidth(fonts.weight.bold)};
`;

export default function BackButton({
  color,
  direction = 'left',
  onPress,
  throttle,
  testID,
  textChevron,
  ...props
}: any) {
  const navigation = useNavigation();

  const handlePress = useCallback(
    event => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.goBack();
    },
    [navigation, onPress]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HeaderButton
      {...(__DEV__
        ? {
            onLongPress() {
              navigation.navigate(Routes.EXPLAIN_SHEET);
            },
          }
        : {})}
      onPress={handlePress}
      opacityTouchable={false}
      radiusAndroid={42}
      radiusWrapperStyle={{
        alignItems: 'center',
        height: 42,
        justifyContent: 'center',
        marginRight: 5,
        width: 42,
        ...(textChevron && { left: 6 }),
      }}
      testID={testID + '-back-button'}
      throttle={throttle}
      transformOrigin={direction}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container {...props} textChevron={textChevron}>
        {textChevron ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <IconText color={color}>←</IconText>
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Icon color={color} direction={direction} name="caret" {...props} />
        )}
      </Container>
    </HeaderButton>
  );
}
