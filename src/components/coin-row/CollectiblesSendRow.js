import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, onlyUpdateForKeys, shouldUpdate, withProps } from 'recompact';
import { css } from 'styled-components/primitives';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import Divider from '../Divider';
import { Centered } from '../layout';
import { Monospace, TruncatedText } from '../text';
import InnerBorder from '../InnerBorder';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const dividerHeight = 22;
const selectedHeight = 78;

const selectedStyles = css`
  ${padding(17, 14, 19, 13)};
  height: ${selectedHeight};
`;

const BottomRow = ({ subtitle }) => (
  <TruncatedText
    color={colors.alpha(colors.blueGreyDark, 0.5)}
    component={Monospace}
    size="smedium"
  >
    {subtitle}
  </TruncatedText>
);

BottomRow.propTypes = {
  subtitle: PropTypes.string,
};

const TopRow = ({ id, name, selected }) => (
  <CoinName
    paddingRight={selected ? undefined : 0}
    weight={selected ? 'semibold' : 'regular'}
  >
    {name || `#${id}`}
  </CoinName>
);

TopRow.propTypes = {
  id: PropTypes.any,
  name: PropTypes.string,
  selected: PropTypes.bool,
};

const enhanceUniqueTokenCoinIcon = onlyUpdateForKeys([
  'background',
  'image_thumbnail_url',
]);

const UniqueTokenCoinIcon = enhanceUniqueTokenCoinIcon(
  ({
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
      <InnerBorder opacity={0.04} radius={8} style={{ zIndex: 2 }} />
    </Centered>
  )
);

UniqueTokenCoinIcon.propTypes = {
  asset_contract: PropTypes.shape({ name: PropTypes.string }),
  background: PropTypes.string,
  image_thumbnail_url: PropTypes.string,
  shouldPrioritizeImageLoading: PropTypes.bool,
};

const buildSubtitleForUniqueToken = ({ item }) => ({
  subtitle: item.name
    ? `${item.asset_contract.name} #${item.id}`
    : item.asset_contract.name,
});

const enhance = compose(
  withProps(buildSubtitleForUniqueToken),
  shouldUpdate((props, nextProps) => {
    const itemIdentifier = buildAssetUniqueIdentifier(props.item);
    const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

    return itemIdentifier !== nextItemIdentifier;
  })
);

const CollectiblesSendRow = enhance(
  ({ item, isFirstRow, onPress, selected, subtitle, ...props }) => (
    <Fragment>
      {isFirstRow && (
        <Centered style={{ height: dividerHeight }}>
          <Divider color={colors.alpha(colors.blueGreyLighter, 0.05)} />
        </Centered>
      )}
      <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
        <CoinRow
          {...props}
          {...item}
          bottomRowRender={BottomRow}
          coinIconRender={UniqueTokenCoinIcon}
          containerStyles={selected ? selectedStyles : null}
          selected={selected}
          subtitle={subtitle}
          topRowRender={TopRow}
        />
      </ButtonPressAnimation>
    </Fragment>
  )
);

CollectiblesSendRow.propTypes = {
  isFirstRow: PropTypes.bool,
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
  subtitle: PropTypes.string,
};

CollectiblesSendRow.dividerHeight = dividerHeight;
CollectiblesSendRow.selectedHeight = selectedHeight;

export default CollectiblesSendRow;
