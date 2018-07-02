import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/native';
import Row from '../layout/Row';
import { H1 } from '../text';
import { colors, fonts } from '../../styles';

const BorderLine = styled.View`
  background-color: #F7F7F8;
  border-bottom-left-radius: 2;
  border-top-left-radius: 2;
  height: 2;
  width: 100%;
`;

const Header = styled(Row)`
  height: 35;
  padding-left: 20;
`;

//{ label }

const AssetListHeader = ({ section: { title }, ...props }) => (
  console.log('AssetListHeader props', props),
  <Fragment>
    <Header align="center" justify="space-between">
      <H1>{title}</H1>
    </Header>
    <BorderLine />
  </Fragment>
);

export default AssetListHeader;
