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

const PinValue = ({ translateX, value, ...props }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Flex {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX }],
        }}
      >
        {value && value.length ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <EmptyValue />
        )}
        {value && value.length > 1 ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <EmptyValue />
        )}
        {value && value.length > 2 ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <EmptyValue />
        )}
        {value && value.length > 3 ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <FilledValue backgroundColor={colors.appleBlue} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <EmptyValue />
        )}
      </Animated.View>
    </Flex>
  );
};

export default React.memo(PinValue);
