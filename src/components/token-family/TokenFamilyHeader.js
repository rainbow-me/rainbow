import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import Divider from '../Divider';
import { Monospace } from '../text';
import { ListHeader } from '../list';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { TruncatedText } from '../text';

const Wrapper = styled.View`
  height: 56px;
  width: 100%;
  padding: 11px 19px;
  align-items: center;
  flex-direction: row;
`;

const Image = styled.View`
  height: 34px;
  width: 34px;
  background-color: #ffd9fe;
  justify-content: center;
  border-radius: 10.3px;
`;

const TokenListHeader = (props) => (
  <Wrapper>
    <Image>

    </Image>
    <TruncatedText
      style={{paddingLeft: 9}}
      lineHeight="normal"
      size="medium"
      weight="semibold"
    >
      {props.familyName}
    </TruncatedText>
  </Wrapper>
);

TokenListHeader.propTypes = {

};

export default TokenListHeader;
