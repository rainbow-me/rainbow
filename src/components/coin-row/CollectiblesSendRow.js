/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { withProps } from 'recompact';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import RequestVendorLogoIcon from '../coin-icon/RequestVendorLogoIcon';
import Divider from '../Divider';

const selectedHeight = 78;

const BottomRow = ({ subtitle }) => {
  return (
    <Monospace
      color={colors.alpha(colors.blueGreyDark, 0.6)}
      size="smedium"
    >
      {subtitle}
    </Monospace>
  );
};

BottomRow.propTypes = {
  id: PropTypes.string,
};

const TopRow = ({ name }) => (
  <CoinName>
    {name}
  </CoinName>
);

TopRow.propTypes = {
  name: PropTypes.string,
  selected: PropTypes.bool,
};

const EnhancedVendorLogo = (props) => (
  <RequestVendorLogoIcon
    backgroundColor={props.background}
    dappName='Balance Manager'
    imageUrl={{ uri: props.image_preview_url }}
    {...props}/>
)


const CollectiblesSendRow = ({
  data,
  onPress,
  isFirstRow,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    {isFirstRow && (
      <View
        style={{ height: DividerHeight }}
      >
        <Divider
          color={colors.alpha(colors.blueGreyLight, 0.05)}
          inset={false}
          flex={0}
        />
      </View>
    )}
    <CoinRow
      {...props}
      {...data}
      coinIconRender={EnhancedVendorLogo}
      bottomRowRender={BottomRow}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

CollectiblesSendRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
};

CollectiblesSendRow.selectedHeight = selectedHeight;

export const DividerHeight = 20;

export default withProps(({ data: asset }) => ({
  subtitle: asset.name
    ? `${asset.asset_contract.name} #${asset.id}`
    : asset.asset_contract.name,
}))(CollectiblesSendRow);
