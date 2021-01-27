import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { Column, Flex } from '../../components/layout';

const FilledValue = styled(Column)`
  width: 20;
  height: 20;
  border-radius: 20;
  margin-left: 10;
  margin-right: 10;
`;

const EmptyValue = styled(Column)`
  border-width: 3;
  width: 20;
  height: 20;
  border-color: ${({ theme: { colors } }) => colors.appleBlue};
  border-radius: 20;
  margin-left: 10;
  margin-right: 10;
`;

const PinValue = ({ translateX, value, ...props }) => {
  const { colors } = useTheme();
  return (
    <Flex {...props}>
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX }],
        }}
      >
        {value && value.length ? (
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 1 ? (
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 2 ? (
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          <EmptyValue />
        )}
        {value && value.length > 3 ? (
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          <EmptyValue />
        )}
      </Animated.View>
    </Flex>
  );
};

export default React.memo(PinValue);
