import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose, onlyUpdateForPropTypes, withHandlers, withState } from 'recompact';
import { colors, position } from '../../styles';
import { AssetList, UniqueTokenRow } from '../asset-list';
import { BalanceCoinRow } from '../coin-row';
import Avatar from '../Avatar';
import Icon from '../icons/Icon';
import { FlexItem, Page } from '../layout';
import HeaderButton from './HeaderButton';

const ActivityHeaderButton = ({ onPress }) => {
  return (
    <HeaderButton onPress={onPress}>
      <Icon
        color={colors.dark}
        name="clock"
      />
    </HeaderButton>
  );
};

ActivityHeaderButton.propTypes = {
  onPress: PropTypes.func,
};

export default ActivityHeaderButton;
