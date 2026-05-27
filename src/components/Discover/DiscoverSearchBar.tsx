import React from 'react';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import DiscoverSearchInput from '@/components/Discover/DiscoverSearchInput';
import { Box, Inline, Text } from '@/design-system';
import { DISCOVER_HEADER_HEIGHT } from '@/features/discover/components/discoverHeaderLayout';
import useDelayedValueWithLayoutAnimation from '@/hooks/useDelayedValueWithLayoutAnimation';
import * as i18n from '@/languages';
import { useTheme } from '@/theme/ThemeContext';
import deviceUtils from '@/utils/deviceUtils';

import { NAVBAR_HORIZONTAL_INSET } from '../navbar/Navbar';

const placeholderText = deviceUtils.isNarrowPhone
  ? i18n.t(i18n.l.discover.search.search_ethereum_short)
  : i18n.t(i18n.l.discover.search.search_ethereum);

export function DiscoverSearchBar() {
  const { colors } = useTheme();
  const { onTapSearch, cancelSearch } = useDiscoverScreenContext();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(isSearching);

  return (
    <Box
      height={{ custom: DISCOVER_HEADER_HEIGHT }}
      width="full"
      justifyContent="center"
      paddingHorizontal={{ custom: NAVBAR_HORIZONTAL_INSET }}
    >
      <Inline alignVertical="center" space={'16px'}>
        <Box justifyContent="center" style={{ flex: 1 }}>
          <DiscoverSearchInput
            clearTextOnFocus={false}
            isDiscover
            onFocus={onTapSearch}
            placeholderText={placeholderText}
            testID="discover-search"
          />
        </Box>
        <ButtonPressAnimation onPress={cancelSearch} testID="done-button">
          {delayedShowSearch && (
            <Text color={{ custom: colors.appleBlue }} size="17pt" weight="semibold">
              {i18n.t(i18n.l.button.done)}
            </Text>
          )}
        </ButtonPressAnimation>
      </Inline>
    </Box>
  );
}
