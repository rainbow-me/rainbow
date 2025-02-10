import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { MarkdownText, Separator, Stack, Text } from '@/design-system';
import { Navigation } from '@/navigation';
import { containsEmoji } from '@/helpers/strings';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

export interface LogEntry {
  message: string;
  title: string;
}

export type ShowLogSheetParams = {
  data: LogEntry[];
};

export function showLogSheet(params: ShowLogSheetParams) {
  Navigation.handleAction(Routes.LOG_SHEET, {
    data: params.data,
  });
}

export const LogSheet = () => {
  const {
    params: { data },
  } = useRoute<RouteProp<RootStackParamList, 'LogSheet'>>();

  return (
    <View style={styles.container}>
      <Panel height={DEVICE_HEIGHT - safeAreaInsetValues.top - safeAreaInsetValues.bottom}>
        <ScrollView contentContainerStyle={styles.scrollContent} scrollIndicatorInsets={{ bottom: 44, top: 44 }} style={styles.scrollView}>
          <Stack space="28px">
            {data?.map(section => (
              <>
                <Text color="label" containsEmoji={containsEmoji(section.title.charAt(0))} size="20pt" weight="heavy">
                  {section.title}
                </Text>
                {section.message ? (
                  <>
                    <MarkdownText color="label" listSpace="12px" paragraphSpace={{ custom: 0 }} size="14px / 19px (Deprecated)">
                      {`\`\`\`\n${section.message}\n\`\`\``}
                    </MarkdownText>
                    <View style={styles.separatorContainer}>
                      <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
                    </View>
                  </>
                ) : (
                  <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
                )}
              </>
            ))}
          </Stack>
        </ScrollView>
      </Panel>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
  },
  scrollContent: {
    paddingBottom: 44,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 28,
  },
  separatorContainer: {
    marginTop: -16,
  },
});
