import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { SectionList } from 'react-native';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { position } from '../../styles';
import { FabWrapper, WalletConnectFab } from '../fab';
import AssetListHeader from './AssetListHeader';
import AssetListItem from './AssetListItem';
import AssetListSkeleton from './AssetListSkeleton';

const Container = styled.View`
  flex: 1;
`;

const List = styled(SectionList)`
  ${position.size('100%')}
`;

const Separator = styled.View`
  height: 27;
`;

const keyExtractor = (item, index) => {
  const key = Array.isArray(item) ? item[0] : get(item, 'symbol');
  return key + index;
};

const AssetList = ({ isEmpty, sections }) => (
  <Container>
    <FabWrapper items={[<WalletConnectFab disabled={isEmpty} key="walletConnectFab" />]}>
      {isEmpty ? (
        <AssetListSkeleton />
      ) : (
        <List
          keyExtractor={keyExtractor}
          renderItem={AssetListItem}
          renderSectionFooter={() => <Separator />}
          renderSectionHeader={headerProps => <AssetListHeader {...headerProps} />}
          sections={sections}
        />
      )}
    </FabWrapper>
  </Container>
);

AssetList.propTypes = {
  isEmpty: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default withProps(({ sections }) => {
  let isEmpty = true;

  for (let i = 0; i < sections.length; i += 1) {
    if (!isEmpty) break;
    isEmpty = !sections[i].totalItems;
  }

  return { isEmpty };
})(AssetList);
