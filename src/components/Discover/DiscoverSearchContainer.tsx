import * as i18n from '@/languages';
import React, { useEffect } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text } from '@/design-system';
import DiscoverSearchInput from '@/components/Discover/DiscoverSearchInput';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { deviceUtils } from '@/utils';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { NAVBAR_HORIZONTAL_INSET, navbarHeight } from '../navbar/Navbar';

// const CancelText = styled(Text).attrs(({ theme: { colors } }: WithThemeProps) => ({
//   align: 'right',
//   color: colors.appleBlue,
//   letterSpacing: 'roundedMedium',
//   size: 'large',
//   weight: 'semibold',
// }))({
//   ...(ios ? {} : { marginTop: -5 }),
//   marginLeft: -3,
//   marginRight: 15,
// });

const placeholderText = deviceUtils.isNarrowPhone
  ? i18n.t(i18n.l.discover.search.search_ethereum_short)
  : i18n.t(i18n.l.discover.search.search_ethereum);

function DiscoverSearchContainer() {
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
            <Text color="blue" size="17pt" weight="semibold">
              {i18n.t(i18n.l.button.done)}
            </Text>
          )}
        </ButtonPressAnimation>
      </Inline>
    </Box>
  );
}

export default DiscoverSearchContainer;
