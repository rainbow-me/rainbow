import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const verticalOffset = (deviceUtils.dimensions.height - 420) / 3;

const Container = styled(Column)`
  align-self: center;
  margin-top: ${verticalOffset};
  width: 200;
`;

const ActivityListEmptyState = ({ children, emoji, label }) => (
  <View>
    {children}
    <Container>
      <Centered>
        <Text letterSpacing="zero" size="h2">
          {emoji}
        </Text>
      </Centered>
      <Centered>
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

ActivityListEmptyState.propTypes = {
  emoji: PropTypes.string,
  label: PropTypes.string,
};

ActivityListEmptyState.defaultProps = {
  emoji: '🏝',
  label: 'No transactions yet',
};

export default ActivityListEmptyState;
