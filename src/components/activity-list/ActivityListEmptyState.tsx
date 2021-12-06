import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { Text } from '../text';

// @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
const verticalOffset = (deviceUtils.dimensions.height - 420) / 3;

const Container = styled(Column)`
  align-self: center;
  margin-top: ${verticalOffset};
  width: 200;
`;

const ActivityListEmptyState = ({ children, emoji, label }: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View>
      {children}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text letterSpacing="zero" size="h2">
            {emoji}
          </Text>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.35)}
            letterSpacing="roundedMedium"
            lineHeight={24}
            size="lmedium"
            weight="semibold"
          >
            {label}
          </Text>
        </Centered>
      </Container>
    </View>
  );
};

ActivityListEmptyState.propTypes = {
  emoji: PropTypes.string,
  label: PropTypes.string,
};

ActivityListEmptyState.defaultProps = {
  emoji: '🏝',
  label: 'No transactions yet',
};

export default ActivityListEmptyState;
