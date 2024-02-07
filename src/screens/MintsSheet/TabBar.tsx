import { ButtonPressAnimation } from '@/components/animations';
import { AccentColorProvider, Box, Cover, Inline, globalColors, Text } from '@/design-system';
import { IS_IOS } from '@/env';
import { MintsFilter, getMintsFilterLabel, useMintsFilter } from '@/resources/mints';
import { useTheme } from '@/theme';
import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

function FilterButton({ filter }: { filter: MintsFilter }) {
  const { filter: currentFilter, setFilter } = useMintsFilter();
  const { isDarkMode } = useTheme();

  const highlightedBackgroundColor = isDarkMode ? 'rgba(255, 218, 36, 0.2)' : 'rgba(255, 203, 15, 0.6)';
  const highlightedTextColor = isDarkMode ? 'yellow' : { custom: globalColors.yellow100 };

  return (
    <AccentColorProvider color={highlightedBackgroundColor}>
      <View
        style={
          IS_IOS
            ? {
                shadowColor: globalColors.grey100,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 3,
                shadowOpacity: 0.02,
              }
            : {}
        }
      >
        <View
          style={{
            ...(IS_IOS
              ? {
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 6,
                  shadowOpacity: 0.24,
                }
              : {
                  elevation: 8,
                  shadowOpacity: 1,
                }),
            shadowColor: isDarkMode ? globalColors.grey100 : highlightedBackgroundColor,
          }}
        >
          <Box
            as={ButtonPressAnimation}
            height="full"
            width={{ custom: 64 }}
            borderRadius={17}
            alignItems="center"
            justifyContent="center"
            background={currentFilter === filter ? 'accent' : undefined}
            onPress={() => {
              setFilter(filter);
            }}
          >
            <Text size="17pt" weight="heavy" align="center" color={currentFilter === filter ? highlightedTextColor : 'labelSecondary'}>
              {getMintsFilterLabel(filter)}
            </Text>
          </Box>
        </View>
      </View>
    </AccentColorProvider>
  );
}

export function TabBar() {
  const { isDarkMode } = useTheme();
  return (
    <Box
      style={{
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 15 },
        shadowRadius: 22.5,
        shadowOpacity: IS_IOS ? (isDarkMode ? 0.8 : 0.3) : 1,
        elevation: 24,
        alignSelf: 'center',
      }}
      position="absolute"
      bottom={{ custom: 43.5 }}
      height="46px"
      borderRadius={23}
    >
      <Cover>
        <Box
          style={{
            borderRadius: 23,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <BlurView
            blurAmount={15}
            blurType={isDarkMode ? 'chromeMaterialDark' : 'light'}
            style={{ height: '100%', width: '100%', borderRadius: 23 }}
          />
        </Box>
      </Cover>
      {/* @ts-ignore */}
      <Box
        as={isDarkMode ? Box : LinearGradient}
        style={{
          height: '100%',
          width: '100%',
          padding: 6,
          borderRadius: 23,
        }}
        colors={
          isDarkMode ? ['rgba(45, 46, 51, 0.70)', 'rgba(45, 46, 51, 0.90)'] : ['rgba(250, 250, 250, 0.63)', 'rgba(240, 240, 240, 0.72)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Inline space="10px">
          <FilterButton filter={MintsFilter.All} />
          <FilterButton filter={MintsFilter.Free} />
          <FilterButton filter={MintsFilter.Paid} />
        </Inline>
      </Box>
    </Box>
  );
}
