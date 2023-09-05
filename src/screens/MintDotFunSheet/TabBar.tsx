import { ButtonPressAnimation } from '@/components/animations';
import {
  AccentColorProvider,
  Box,
  Cover,
  Inline,
  globalColors,
  Text,
} from '@/design-system';
import { IS_IOS } from '@/env';
import {
  MintableCollectionsFilter,
  getMintableCollectionsFilterLabel,
  useMintableCollectionsFilter,
} from '@/resources/mintdotfun';
import { useTheme } from '@/theme';
import { BlurView } from '@react-native-community/blur';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

function FilterButton({ filter }: { filter: MintableCollectionsFilter }) {
  const { filter: currentFilter, setFilter } = useMintableCollectionsFilter();
  const { isDarkMode } = useTheme();

  const highlightedBackgroundColor = `rgba(255, 223, 61, ${
    isDarkMode ? 0.07 : 0.6
  })`;
  const highlightedTextColor = isDarkMode
    ? 'yellow'
    : { custom: globalColors.yellow100 };

  return (
    <AccentColorProvider color={highlightedBackgroundColor}>
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
        shadow="12px accent"
      >
        <Text
          size="17pt"
          weight="heavy"
          align="center"
          color={
            currentFilter === filter ? highlightedTextColor : 'labelSecondary'
          }
        >
          {getMintableCollectionsFilterLabel(filter)}
        </Text>
      </Box>
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
        <BlurView
          blurAmount={15}
          blurType={isDarkMode ? 'chromeMaterialDark' : 'light'}
          style={{ height: '100%', width: '100%', borderRadius: 23 }}
        />
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
          isDarkMode
            ? ['rgba(45, 46, 51, 0.70)', 'rgba(45, 46, 51, 0.90)']
            : ['rgba(250, 250, 250, 0.63)', 'rgba(240, 240, 240, 0.72)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Inline space="10px">
          <FilterButton filter={MintableCollectionsFilter.All} />
          <FilterButton filter={MintableCollectionsFilter.Free} />
          <FilterButton filter={MintableCollectionsFilter.Paid} />
        </Inline>
      </Box>
    </Box>
  );
}
