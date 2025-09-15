import * as i18n from '@/languages';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Text } from '../text';
import styled from '@/styled-thing';

const Container = styled(Column)({
  alignSelf: 'center',
  justifyContent: 'center',
  width: 200,
});

type ActivityListEmptyStateProps = {
  children?: React.ReactNode;
  emoji?: string;
  label?: string;
};

const ActivityListEmptyState = ({
  children,
  emoji = '🏝',
  label = i18n.t(i18n.l.activity_list.empty_state.default_label),
}: ActivityListEmptyStateProps) => {
  const { top: topInset } = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();

  return (
    <View>
      {children}
      <Container height={deviceUtils.dimensions.height - (navbarHeight + topInset) * 2}>
        <Centered>
          <Text align="center" letterSpacing="zero" size="h2">
            {emoji}
          </Text>
        </Centered>
        <Centered>
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, isDarkMode ? 0.4 : 0.3)}
            letterSpacing="roundedMedium"
            lineHeight={24}
            size="lmedium"
            weight="bold"
          >
            {label}
          </Text>
        </Centered>
      </Container>
    </View>
  );
};

export default ActivityListEmptyState;
