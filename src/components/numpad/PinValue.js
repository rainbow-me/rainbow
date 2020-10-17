import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Column, Row } from '../../components/layout';
import { colors } from '@rainbow-me/styles';

const FilledValue = styled(Column)`
  width: 30;
  height: 30;
  border-radius: 30;
  margin-left: 10;
  margin-right: 10;
`;

const EmptyValue = styled(Column)`
  border-width: 3;
  width: 20;
  height: 20;
  border-color: ${colors.appleBlue};
  border-radius: 20;
  margin-left: 10;
  margin-right: 10;
  margin-top: 5;
`;

const PinValue = ({ scale, translateX, value, ...props }) => {
  return (
    <Animated.View
      flex={1}
      style={{ transform: [{ scale, translateX }] }}
      {...props}
    >
      <Row>
        {value && value.length ? (
          <FilledValue backgroundColor={colors.swapPurple} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 1 ? (
          <FilledValue backgroundColor={colors.swapPurple} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 2 ? (
          <FilledValue backgroundColor={colors.swapPurple} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 3 ? (
          <FilledValue backgroundColor={colors.swapPurple} />
        ) : (
          <EmptyValue />
        )}
      </Row>
    </Animated.View>
  );
};

export default React.memo(PinValue);
