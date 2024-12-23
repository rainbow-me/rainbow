import lang from 'i18n-js';
import React, { useEffect } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Column, Row } from '@/components/layout';
import { Text } from '@/components/text';
import DiscoverSearchInput from '@/components/Discover/DiscoverSearchInput';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { deviceUtils } from '@/utils';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import styled from '@/styled-thing';
import { ThemeContextProps } from '@/theme';

const CancelButton = styled(ButtonPressAnimation)({
  marginTop: 9,
});

type WithThemeProps = {
  theme: ThemeContextProps;
};

const CancelText = styled(Text).attrs(({ theme: { colors } }: WithThemeProps) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: 'semibold',
}))({
  ...(ios ? {} : { marginTop: -5 }),
  marginLeft: -3,
  marginRight: 15,
});

const placeholderText = deviceUtils.isNarrowPhone
  ? lang.t('discover.search.search_ethereum_short')
  : lang.t('discover.search.search_ethereum');

export let discoverOpenSearchFnRef: () => void = () => null;

function DiscoverSearchContainer({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery, isLoading, isSearching, onTapSearch, cancelSearch } = useDiscoverScreenContext();
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(isSearching);

  useEffect(() => {
    discoverOpenSearchFnRef = onTapSearch;
  }, [onTapSearch]);

  return (
    <>
      <Row>
        <Column flex={1} marginHorizontal={4}>
          <DiscoverSearchInput
            clearTextOnFocus={false}
            isDiscover
            isLoading={isLoading}
            onChangeText={setSearchQuery}
            onFocus={onTapSearch}
            placeholderText={isSearching ? placeholderText : `􀊫 ${placeholderText}`}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        <CancelButton onPress={cancelSearch} testID="done-button">
          {delayedShowSearch && <CancelText>{lang.t('button.done')}</CancelText>}
        </CancelButton>
      </Row>
      {children}
    </>
  );
}

export default DiscoverSearchContainer;
