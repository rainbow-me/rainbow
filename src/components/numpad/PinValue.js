import React from 'react';
import Animated from 'react-native-reanimated';
import { Column, Flex } from '../../components/layout';
import styled from 'rainbowed-components';

const FilledValue = styled(Column)({
  borderRadius: 20,
  height: 20,
  marginLeft: 10,
  marginRight: 10,
  width: 20,
});

const EmptyValue = styled(Column)({
  borderColor: ({ theme: { colors } }) => colors.appleBlue,
  borderRadius: 20,
  borderWidth: 3,
  height: 20,
  marginLeft: 10,
  marginRight: 10,
  width: 20,
});

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
