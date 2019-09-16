import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import {
  AddContactState,
  InvestmentExpandedState,
  TokenExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { padding } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import { addNewLocalContact } from '../handlers/commonStorage';

const {
  bottom: safeAreaBottom,
  top: safeAreaTop,
} = safeAreaInsetValues;

const ScreenTypes = {
  contact: AddContactState,
  token: TokenExpandedState,
  // eslint-disable-next-line camelcase
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
};

class ExpandedAssetScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: "",
      color: 0,
      shouldSave: false,
    };
  }

  shouldComponentUpdate = () => {
    return false;
  }

  componentWillUnmount = async () => {
    if (this.state.shouldSave && this.props.type == "contact") {
      await addNewLocalContact(this.props.address, this.state.value, this.state.color);
      this.props.onCloseModal();
    }
  }

  setNewValuesToSave = (value, color, shouldSave = true) => {
    this.setState({
      value: value,
      color: color,
      shouldSave: shouldSave,
    });
  }

  render() {
  let newProps = Object.assign({}, this.props);
  newProps.onUnmountModal = this.setNewValuesToSave;

  return (
  <Centered
    {...deviceUtils.dimensions}
    css={padding(safeAreaTop, this.props.containerPadding, safeAreaBottom || safeAreaTop)}
    direction="column"
  >
    <StatusBar barStyle="light-content" />
    <TouchableBackdrop onPress={this.props.onPressBackground} />
    {createElement(ScreenTypes[this.props.type], newProps)}
  </Centered>
  )
  }
};

ExpandedAssetScreen.propTypes = {
  asset: PropTypes.object,
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  panelWidth: PropTypes.number,
  type: PropTypes.oneOf(Object.keys(ScreenTypes)).isRequired,
};

ExpandedAssetScreen.defaultProps = {
  containerPadding: 15,
};

export default ExpandedAssetScreen;
