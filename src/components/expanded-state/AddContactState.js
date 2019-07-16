import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager, KeyboardAvoidingView, View } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';
import { withAccountData, withAccountSettings } from '../../hoc';
import { ethereumUtils, deviceUtils } from '../../utils';
import styled from 'styled-components/primitives';
import { Input } from '../inputs';
import { colors } from '../../styles';
import { Button } from '../buttons';
import { Monospace, TruncatedAddress } from '../text';
import { Text } from 'react-primitives';
import { abbreviations } from '../../utils';
import { CancelButton } from '../buttons';
import {
  addNewLocalContact,
  deleteLocalContact,
} from '../../handlers/commonStorage';

const TopMenu = styled(View)`
  justify-content: center;
  align-items: center;
  width: ${deviceUtils.dimensions.width - 110};
  padding: 24px;
`;

const Container = styled(View)`
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const NameCircle = styled(View)`
  height: 60px;
  width: 60px;
  border-radius: 30px;
  margin-bottom: 19px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  line-height: 58px;
  font-size: 27px;
  color: #fff;
  padding-left: 2px;
  font-weight: 600;
`;

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'lmedium',
  truncationLength: 4,
  weight: 'regular',
  color: colors.blueGreyDark,
})`
  opacity: 0.6;
  width: 100%;
  margin-top: 9px;
  margin-bottom: 5px;
`;

const Divider = styled(View)`
  width: 93px;
  margin: 19px 0;
  height: 2px;
  opacity: 0.05;
  background-color: ${colors.blueGreyLigter};
`;


class AddContactState extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      value: "",
    };
  }

  componentDidMount = () => {
    if (this.props.contact.nickname) {
      this.setState({ value: this.props.contact.nickname });
    }
  }

  format = (string) => (
    this.props.format
      ? this.props.format(string)
      : string
  )

  onChange = (event) => {
    const { nativeEvent } = event;

    const value = this.format(nativeEvent.text);
    if (value !== this.value) {
      this.setState({ value });
    }
  }

  addContact = async () => {
    await addNewLocalContact(this.props.address, this.state.value, this.props.color);
    this.props.navigation.goBack();
  }

  render() {
    return <KeyboardAvoidingView behavior="padding">
      <FloatingPanels
        width={100}
      >
        <Container>
          <AssetPanel>
            <TopMenu>
              <NameCircle style={{ backgroundColor: colors.avatarColor[this.props.color] }}>
                <FirstLetter>
                  {this.state.value.length > 0 && this.state.value[0].toUpperCase()}
                </FirstLetter>
              </NameCircle>
              <Input
                style={{ fontWeight: 600 }}
                autoFocus={true}
                color={colors.blueGreyDark}
                family={'SFProDisplay'}
                maxLength={20}
                onChange={this.onChange}
                placeholder={'Name'}
                size="big"
                textAlign={'center'}
                value={this.state.value}
              />
              <AddressAbbreviation address={this.props.address} />
              <Divider />
              <Button
                backgroundColor={this.state.value.length > 0 ? colors.appleBlue : undefined}
                width={215}
                showShadow
                disabled={!this.state.value.length > 0}
                onPress={this.addContact}
              >
                {this.props.contact ? `Done` : `Add Contact`}
              </Button>
              {!this.props.contact ?
                <CancelButton
                  style={{ paddingTop: 11 }}
                  onPress={() => { this.props.navigation.goBack() }}
                  text="Cancel"
                /> :
                <CancelButton
                  style={{ paddingTop: 11 }}
                  onPress={async () => { await deleteLocalContact(this.props.address); this.props.navigation.goBack() }}
                  text="Delete Contact"
                />
              }
            </TopMenu>
          </AssetPanel>
        </Container>
      </FloatingPanels>
    </KeyboardAvoidingView>
  }
};

AddContactState.propTypes = {
  onPressSend: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountData,
  withAccountSettings,
  withProps(({
    asset: {
      name,
      symbol,
      ...asset
    },
    contact: {
      nickname,
      ...contact
    },
    address,
    color,
    assets,
    nativeCurrencySymbol,
  }) => {
    const selectedAsset = ethereumUtils.getAsset(assets, address);
    return {
      price: get(selectedAsset, 'native.price.display', null),
      subtitle: get(selectedAsset, 'balance.display', symbol),
      title: name,
    };
  }),
  withHandlers({
    onPressSend: ({ navigation, asset: { address } }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset: address });
      });
    },
  }),
  onlyUpdateForKeys(['price', 'subtitle']),
)(AddContactState);
