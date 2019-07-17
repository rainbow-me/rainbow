import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import Divider from '../Divider';
import { AddressField } from '../fields';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Label } from '../text';
import { colors, padding } from '../../styles';
import { PasteAddressButton, AddContactButton } from '../buttons';
import { Text } from 'react-native';
import { withNavigation } from 'react-navigation';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${padding(19, 15)}
  background-color: ${colors.white};
  overflow: hidden;
  width: 100%;
`;
const Nickname = styled(Text)`
  background-color: ${colors.white};
  overflow: hidden;
  height: 45px;
  width: 76.5%;
  margin-right: -20px;
  line-height: 45px;
`;

const SendHeader = ({ onChangeAddressInput, recipient, onPressPaste, isValidAddress, contacts, navigation }) => {
  let headerName = "";
  for ( let i = 0; i < contacts.length; i++ ) {
    if(recipient == contacts[i].address){
      headerName = contacts[i].nickname;
    }
  }

  return (
    <Fragment>
      <Icon
        color={colors.sendScreen.grey}
        name="handle"
        style={{ height: 11, marginTop: 13 }}
      />
      <AddressInputContainer>
        <Label style={{ marginRight: 6, opacity: 0.45 }}>
          To:
        </Label>
        <AddressField
          address={recipient}
          autoFocus
          onChange={onChangeAddressInput}
          headerName={headerName}
          />
        {isValidAddress ? headerName.length > 0 ? 
        null : 
        <AddContactButton onPress={() => {
          navigation.navigate('ExpandedAssetScreen', {
            address: recipient,
            color: 1,
            asset: contacts[0],
            contact: false,
            type: 'contact',
          });
        }}/>  : 
        <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      <Divider
        color={colors.alpha(colors.blueGreyLight, 0.05)}
        flex={0}
        inset={false}
      />
    </Fragment>
  )
};

SendHeader.propTypes = {
  onChangeAddressInput: PropTypes.func,
  recipient: PropTypes.string,
  onPressPaste: PropTypes.func,
};

export default compose(withNavigation)(SendHeader);
