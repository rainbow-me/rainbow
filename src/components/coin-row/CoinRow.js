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

const BalanceText = styled.Text`
  font-family: ${fonts.family.SFMono};
  font-size: 15px;
  color: ${colors.blueGreyDark};
  font-weight: ${fonts.weight.normal};
`;

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
  balance,
  imgPath,
  name,
  symbol,
}) => (
  <Container align="center">
    <CoinIcon source={imgPath} />
    <Content>
      <ContentRow>
        <CoinName>{name}</CoinName>
        <BalanceText>{'$50.00'}</BalanceText>
      </ContentRow>
      <ContentRow>
        <Text>{`${Number(balance).toFixed(8)} ${symbol}`}</Text>
        <Text>{'1.58%'}</Text>
      </ContentRow>
    </Content>
  </Container>
);

CoinRow.propTypes = {
  balance: PropTypes.string,
  imgPath: PropTypes.string,
  name: PropTypes.string,
  symbol: PropTypes.string,
};

export default CoinRow;
