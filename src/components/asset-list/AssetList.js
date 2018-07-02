import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { Image, Text, View } from 'react-native';
import styled from 'styled-components/native';
import Row from '../layout/Row';
import Column from '../layout/Column';
import Label from '../Label';
import Section from '../Section';
// import Text from '../Text';
import CoinIcon from '../CoinIcon';
import CoinName from './CoinName';
import { H1 } from '../text';
import { colors, fonts } from '../../styles';

const BorderLine = styled.View`
  background-color: #F7F7F8;
  border-bottom-left-radius: 2;
  border-top-left-radius: 2;
  height: 2;
  margin-left: 20;
  width: 100%;
`;

const Cointainer = styled(Column)`
  width: 100%;
`;

const Content = styled.View`
  background-color: #f7f7f7;
`;

const Header = styled(Row)`
  padding: 15px 18px 15px 20px;
`;

const AssetList = ({ assets, label }) => (
  <Cointainer>
    <Header>
      <H1>{label}</H1>

    </Header>
    <BorderLine />
    <Content>
      <Fragment>
        {assets}
      </Fragment>
    </Content>
  </Cointainer>
);

AssetList.propTypes = {
  assets: PropTypes.arrayOf(PropTypes.node),
  label: PropTypes.string,
};

export default AssetList;
