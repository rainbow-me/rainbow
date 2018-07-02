import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';
import styled from 'styled-components/native';
import Row from '../layout/Row';
import Column from '../layout/Column';
import Label from '../Label';
import Section from '../Section';
// import Text from '../Text';
import CoinIcon from '../CoinIcon';
import CoinName from './CoinName';
import { colors, fonts } from '../../styles';

const Container = styled(Row)`
  padding: 15px 18px 15px 20px;
`;

const Content = styled(Column)`
  flex: 1;
  margin-left: 12px;
`;

const ContentRow = styled(props => <Row {...props} align="center" justify="space-between" />)`
  &:first-of-type {
    margin-bottom: 6px;
  }
`;

const CoinRow = ({
  address,
  balance,
  bottomRowRender,
  name,
  symbol,
  topRowRender,
}) => (
  <Container align="center">
    <CoinIcon
      address={address}
      symbol={symbol}
    />
    <Content>
      <ContentRow>
        {topRowRender({
          address,
          balance,
          name,
          symbol,
        })}
      </ContentRow>
      <ContentRow>
        {bottomRowRender({
          address,
          balance,
          name,
          symbol,
        })}
      </ContentRow>
    </Content>
  </Container>
);

CoinRow.propTypes = {
  address: PropTypes.string,
  balance: PropTypes.number,
  bottomRowRender: PropTypes.func,
  name: PropTypes.string,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

export default CoinRow;
