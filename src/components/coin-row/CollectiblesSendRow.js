import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import {
  compose,
  onlyUpdateForKeys,
  shouldUpdate,
  withProps,
} from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import Divider from '../Divider';
import { Centered } from '../layout';
import { Monospace } from '../text';
import InnerBorder from '../InnerBorder';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const dividerHeight = 22;
const selectedHeight = 78;

const BottomRow = ({ subtitle }) => (
  <Monospace
    color={colors.alpha(colors.blueGreyDark, 0.6)}
    size="smedium"
  >
    {subtitle}
  </Monospace>
);

BottomRow.propTypes = {
  subtitle: PropTypes.string,
};

const TopRow = ({ name }) => (
  <CoinName paddingRight={0}>
    {name}
  </CoinName>
);

TopRow.propTypes = {
  name: PropTypes.string,
};

const enhanceUniqueTokenCoinIcon = onlyUpdateForKeys(['background', 'image_thumbnail_url']);

/* eslint-disable camelcase */
const UniqueTokenCoinIcon = enhanceUniqueTokenCoinIcon(({
  asset_contract: { name },
  background,
  image_thumbnail_url,
  shouldPrioritizeImageLoading,
  ...props
}) => (
  <Centered shouldRasterizeIOS>
    <RequestVendorLogoIcon
      backgroundColor={background || colors.lightestGrey}
      borderRadius={8}
      dappName={name}
      imageUrl={image_thumbnail_url}
      shouldPrioritizeImageLoading={shouldPrioritizeImageLoading}
      {...props}
    />
    <InnerBorder
      opacity={0.04}
      radius={8}
      style={{ zIndex: 2 }}
    />
  </Centered>
));

UniqueTokenCoinIcon.propTypes = {
  asset_contract: PropTypes.shape({ name: PropTypes.string }),
  background: PropTypes.string,
  image_thumbnail_url: PropTypes.string,
  shouldPrioritizeImageLoading: PropTypes.bool,
};
/* eslint-enable camelcase */

const buildSubtitleForUniqueToken = ({ data }) => ({
  subtitle: data.name
    ? `${data.asset_contract.name} #${data.id}`
    : data.asset_contract.name,
});

const enhance = compose(
  withProps(buildSubtitleForUniqueToken),
  shouldUpdate((props, nextProps) => {
    const itemIdentifier = buildAssetUniqueIdentifier(props.data);
    const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.data);

    return itemIdentifier !== nextItemIdentifier;
  }),
);

const CollectiblesSendRow = enhance(({
  data,
  isFirstRow,
  onPress,
  subtitle,
  ...props
}) => (
  <Fragment>
    {isFirstRow && (
      <Centered style={{ height: dividerHeight }}>
        <Divider color={colors.alpha(colors.blueGreyLigter, 0.05)} />
      </Centered>
    )}
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <CoinRow
        {...props}
        {...data}
        bottomRowRender={BottomRow}
        coinIconRender={UniqueTokenCoinIcon}
        subtitle={subtitle}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  </Fragment>
));

CollectiblesSendRow.propTypes = {
  data: PropTypes.object,
  isFirstRow: PropTypes.bool,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
  subtitle: PropTypes.string,
};

CollectiblesSendRow.dividerHeight = dividerHeight;
CollectiblesSendRow.selectedHeight = selectedHeight;

export default CollectiblesSendRow;
