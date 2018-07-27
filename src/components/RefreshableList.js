import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, RefreshControl } from 'react-native';

// note: copied from https://facebook.github.io/react-native/docs/refreshcontrol
class RefreshableList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  _onRefresh = () => {
    const { fetchData } = this.props;

    this.setState({ refreshing: true });
    fetchData().then(() => {
      this.setState({ refreshing: false });
    });
  }

  render() {
    const { data, renderItem } = this.props;
    const { refreshing } = this.state;

    return (
      <FlatList
        data={data}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this._onRefresh}
          />
        }
        renderItem={renderItem}
      />
    );
  }
}

RefreshableList.propTypes = {
  data: PropTypes.array.isRequired,
  fetchData: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
};

export default RefreshableList;
