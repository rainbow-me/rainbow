import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { SectionList } from 'react-native';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { position } from '../../styles';
import AssetListHeader from './AssetListHeader';
import AssetListItem from './AssetListItem';
import AssetListSkeleton from './AssetListSkeleton';

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
  isEmpty ? (
    <AssetListSkeleton />
  ) : (
    <List
      keyExtractor={keyExtractor}
      renderItem={AssetListItem}
      renderSectionFooter={() => <Separator />}
      renderSectionHeader={headerProps => <AssetListHeader {...headerProps} />}
      sections={sections}
    />
  )
);

AssetList.propTypes = {
  isEmpty: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.object),
};

AssetList.defaultProps = {
  // isEmpty: true,
};

export default compose(
  withProps(({ sections }) => {
    // sections.map(section => {

    // })
    // console.log('sections', sections);
    // return { isEmpty:
  }),
)(AssetList);
