import PropTypes from 'prop-types';
import React from 'react';
import { RefreshControl, SectionList as ReactSectionList } from 'react-native';
import { View } from 'react-primitives';
import { compose, omitProps, withHandlers, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { colors, position } from '../../styles';
import ListFooter from './ListFooter';
import ListHeader from './ListHeader';

const DefaultRenderItem = renderItemProps => <View {...renderItemProps} />;

const List = styled(ReactSectionList)`
  ${position.size('100%')}
  background-color: ${colors.white};
`;

const SectionList = ({
  enablePullToRefresh,
  isRefreshing,
  onRefresh,
  renderItem,
  renderSectionFooter,
  safeAreaInset,
  showSafeAreaInsetBottom,
  ...props
}) => (
  <List
    refreshControl={(
      enablePullToRefresh ? (
        <RefreshControl
          onRefresh={onRefresh}
          refreshing={isRefreshing}
        />
      ) : null
    )}
    renderItem={renderItem}
    renderSectionFooter={renderSectionFooter}
    scrollIndicatorInsets={{
      bottom: showSafeAreaInsetBottom ? safeAreaInset.bottom : 0,
      top: ListHeader.height,
    }}
    {...props}
  />
);

SectionList.propTypes = {
  enablePullToRefresh: PropTypes.bool,
  fetchData: PropTypes.func,
  isRefreshing: PropTypes.bool,
  onRefresh: PropTypes.func,
  renderItem: PropTypes.func,
  renderSectionFooter: PropTypes.func,
  showSafeAreaInsetBottom: PropTypes.bool,
};

SectionList.defaultProps = {
  enablePullToRefresh: false,
  renderItem: DefaultRenderItem,
  renderSectionFooter: ListFooter,
  showSafeAreaInsetBottom: true,
};

export default compose(
  withSafeAreaViewInsetValues,
  withState('isRefreshing', 'setIsRefreshing', false),
  withHandlers({
    onRefresh: ({ fetchData, isRefreshing, setIsRefreshing }) => () => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      fetchData().then(() => setIsRefreshing(false));
    },
  }),
  omitProps('fetchData', 'setIsRefreshing'),
)(SectionList);
