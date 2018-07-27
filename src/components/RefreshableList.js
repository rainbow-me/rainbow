import React from 'react';
import PropTypes from 'prop-types';
import { SectionList, RefreshControl } from 'react-native';

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
    const { refreshing } = this.state;

    return (
      <SectionList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this._onRefresh}
          />
        }
        { ...this.props}
      />
    );
  }
}

RefreshableList.propTypes = {
  contentContainerStyle: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  keyExtractor: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  renderSectionFooter: PropTypes.func.isRequired,
  renderSectionHeader: PropTypes.func.isRequired,
  sections: PropTypes.array.isRequired,
};

export default RefreshableList;
