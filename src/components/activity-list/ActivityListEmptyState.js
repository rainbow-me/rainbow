import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';

const verticalOffset = (deviceUtils.dimensions.height - 420) / 3;

const Container = styled(Column)({
  alignSelf: 'center',
  marginTop: verticalOffset,
  width: 200,
});

const ActivityListEmptyState = ({ children, emoji, label }) => {
  const { colors } = useTheme();

  return (
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
};

ActivityListEmptyState.propTypes = {
  emoji: PropTypes.string,
  label: PropTypes.string,
};

ActivityListEmptyState.defaultProps = {
  emoji: '🏝',
  label: lang.t('activity_list.empty_state.default_label'),
};

export default ActivityListEmptyState;
