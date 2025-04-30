import React from 'react';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text } from '@/design-system';
import DiscoverSearchInput from '@/components/Discover/DiscoverSearchInput';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { deviceUtils } from '@/utils';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { NAVBAR_HORIZONTAL_INSET, navbarHeight } from '../navbar/Navbar';
import { useTheme } from '@/theme';

const placeholderText = deviceUtils.isNarrowPhone
  ? i18n.t(i18n.l.discover.search.search_ethereum_short)
  : i18n.t(i18n.l.discover.search.search_ethereum);

export function DiscoverSearchBar() {
  const { colors } = useTheme();
  const { onTapSearch, cancelSearch } = useDiscoverScreenContext();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(isSearching);

  return (
    <Box height={navbarHeight} width="full" justifyContent="center" paddingHorizontal={{ custom: NAVBAR_HORIZONTAL_INSET }}>
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
