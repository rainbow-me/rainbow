import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { RefreshControl, SectionList as ReactSectionList } from 'react-native';
import { View } from 'react-primitives';
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

class SectionList extends PureComponent {
  static propTypes = {
    enablePullToRefresh: PropTypes.bool,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    isRefreshing: PropTypes.bool,
    onRefresh: PropTypes.func,
    renderItem: PropTypes.func,
    renderSectionFooter: PropTypes.func,
    safeAreaInset: PropTypes.object,
    showSafeAreaInsetBottom: PropTypes.bool,
  }

  static defaultProps = {
    enablePullToRefresh: false,
    renderItem: DefaultRenderItem,
    renderSectionFooter: ListFooter,
    showSafeAreaInsetBottom: true,
  }

  state = { isRefreshing: false }

  componentDidMount = () => {
    this.isCancelled = false;
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
  }

  listRef = null

  handleListRef = (ref) => { this.listRef = ref; }

  handleRefresh = () => {
    if (this.state.isRefreshing) return;

    this.setState({ isRefreshing: true });
    this.props.fetchData().then(() => {
      if (!this.isCancelled) {
        this.setState({ isRefreshing: false });
      }
    });
  }

  renderRefreshControl = () => {
    if (!this.props.enablePullToRefresh) return null;

    return (
      <RefreshControl
        onRefresh={this.handleRefresh}
        refreshing={this.state.isRefreshing}
        tintColor={colors.alpha(colors.blueGreyLight, 0.666)}
      />
    );
  }

  render = () => {
    const {
      hideHeader,
      renderItem,
      renderSectionFooter,
      safeAreaInset,
      showSafeAreaInsetBottom,
      ...props
    } = this.props;

    return (
      <List
        refreshControl={this.renderRefreshControl()}
        renderItem={renderItem}
        ref={this.handleListRef}
        renderSectionFooter={renderSectionFooter}
        scrollIndicatorInsets={{
          bottom: showSafeAreaInsetBottom ? safeAreaInset.bottom : 0,
          top: hideHeader ? 0 : ListHeader.height,
        }}
        {...props}
      />
    );
  }
}

export default withSafeAreaViewInsetValues(SectionList);
