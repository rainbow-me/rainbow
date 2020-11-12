import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import HeaderButton from './HeaderButton';

const Container = styled(Row).attrs({ align: 'center' })`
  height: 24;
  width: 10;
`;

export default function BackButton({
  color,
  direction = 'left',
  onPress,
  throttle,
  testID,
  ...props
}) {
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
      }}
      testID={testID + '-back-button'}
      throttle={throttle}
      transformOrigin={direction}
    >
      <Container {...props}>
        <Icon color={color} direction={direction} name="caret" {...props} />
      </Container>
    </HeaderButton>
  );
}
