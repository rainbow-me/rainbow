import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose, onlyUpdateForPropTypes, withHandlers, withState } from 'recompact';
import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import Avatar from '../components/Avatar';
import { Header, HeaderButton } from '../components/header';
import Icon from '../components/icons/Icon';
import { FlexItem, Page } from '../components/layout';
import { colors, position } from '../styles';

const ActivityButton = ({ onPress }) => {
  return (
    <HeaderButton onPress={onPress}>
      <Icon
        color={colors.dark}
        name="clock"
      />
    </HeaderButton>
  );
};

ActivityButton.propTypes = {
  onPress: PropTypes.func,
};

export default ActivityButton;
