import React, { useCallback } from 'react';
import { NavigationActions } from 'react-navigation';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import HeaderButton from './HeaderButton';

const Container = styled(Row).attrs({ align: 'end' })`
  height: 100%;
  padding-bottom: 2;
`;

export default function BackButton({ color, direction, onPress, ...props }) {
  const navigation = useNavigation();

  const handlePress = useCallback(
    event => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.dispatch(NavigationActions.back());
    },
    [navigation, onPress]
  );

  return (
    <HeaderButton onPress={handlePress} transformOrigin={direction}>
      <Container {...props}>
        <Icon color={color} direction={direction} name="caret" {...props} />
      </Container>
    </HeaderButton>
  );
}
