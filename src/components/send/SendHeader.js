import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import Divider from '../Divider';
import { AddressField } from '../fields';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Label } from '../text';
import { colors, padding } from '../../styles';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${padding(19, 15)}
  background-color: ${colors.white};
  overflow: hidden;
  width: 100%;
`;

const SendHeader = ({ onChangeAddressInput, recipient }) => (
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
        autoFocus
        onChange={onChangeAddressInput}
        value={recipient}
      />
    </AddressInputContainer>
    <Divider
      color={colors.alpha(colors.blueGreyLight, 0.05)}
      inset={false}
      flex={0}
    />
  </Fragment>
);

SendHeader.propTypes = {
  onChangeAddressInput: PropTypes.func,
  recipient: PropTypes.string,
};

export default pure(SendHeader);
