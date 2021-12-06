import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ColumnWithMargins, FlexItem } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverHome' was resolved to '/Users/ni... Remove this comment to see the full error message
import DiscoverHome from './DiscoverHome';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSearch' was resolved to '/Users/... Remove this comment to see the full error message
import DiscoverSearch from './DiscoverSearch';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSearchContainer' was resolved to... Remove this comment to see the full error message
import DiscoverSearchContainer from './DiscoverSearchContainer';

const HeaderTitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
}))``;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: 16;
`;

function Switcher({ showSearch, children }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={{ display: showSearch ? 'flex' : 'none' }}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {showSearch ? children[0] : <FlexItem />}
      </View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={{ display: showSearch ? 'none' : 'flex' }}>
        {children[1]}
      </View>
    </>
  );
}

export default function DiscoverSheetContent() {
  const [showSearch, setShowSearch] = useState(false);
  const ref = useRef();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android && <Spacer />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <HeaderTitle
        testID={showSearch ? 'discover-header-search' : 'discover-header'}
      >
        {showSearch ? 'Search' : 'Discover'}
      </HeaderTitle>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins flex={1} margin={42} testID="discover-home">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <DiscoverSearchContainer
          ref={ref}
          setShowSearch={setShowSearch}
          showSearch={showSearch}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Switcher showSearch={showSearch}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <DiscoverSearch />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <DiscoverHome />
          </Switcher>
        </DiscoverSearchContainer>
      </ColumnWithMargins>
    </>
  );
}
