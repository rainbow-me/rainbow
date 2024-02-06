import React, { useCallback } from 'react';
import { useNavigation } from '../../navigation/Navigation';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import Text from '../text/Text';
import HeaderButton from './HeaderButton';
import styled from '@/styled-thing';
import { fonts, fontWithWidth } from '@/styles';

const Container = styled(Row).attrs({ align: 'center' })({
  height: 44,
  width: ({ textChevron }) => (textChevron ? 20 : 10),
});

const IconText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'big',
}))(fontWithWidth(fonts.weight.bold));

export default function BackButton({ color, direction = 'left', onPress, throttle, testID, textChevron, ...props }) {
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
    <HeaderButton
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
      <Container {...props} textChevron={textChevron}>
        {textChevron ? <IconText color={color}>←</IconText> : <Icon color={color} direction={direction} name="caret" {...props} />}
      </Container>
    </HeaderButton>
  );
}
