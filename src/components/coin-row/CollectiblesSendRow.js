import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, onlyUpdateForKeys, shouldUpdate, withProps } from 'recompact';
import { css } from 'styled-components/primitives';
import { useTheme, withThemeContext } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Centered, InnerBorder } from '../layout';
import { TruncatedText } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { padding } from '@rainbow-me/styles';

const dividerHeight = 22;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 62 : 78;

const selectedStyles = css`
  ${padding(17, 14, 19, 13)};
  height: ${selectedHeight};
`;

const BottomRow = ({ subtitle }) => {
  const { colors } = useTheme();
  return (
    <TruncatedText
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      size="smedium"
    >
      {subtitle}
    </TruncatedText>
  );
};

const TopRow = ({ id, name, selected }) => (
  <CoinName
    paddingRight={selected ? undefined : 0}
    weight={selected ? 'semibold' : 'regular'}
  >
    {name || `#${id}`}
  </CoinName>
);

const enhanceUniqueTokenCoinIcon = onlyUpdateForKeys([
  'background',
  'image_thumbnail_url',
]);

const UniqueTokenCoinIcon = enhanceUniqueTokenCoinIcon(
  withThemeContext(
    ({
      asset_contract: { name },
      background,
      image_thumbnail_url,
      shouldPrioritizeImageLoading,
      ...props
    }) => (
      <Centered>
        <RequestVendorLogoIcon
          backgroundColor={background || props.colors.lightestGrey}
          borderRadius={8}
          dappName={name}
          imageUrl={image_thumbnail_url}
          shouldPrioritizeImageLoading={shouldPrioritizeImageLoading}
          {...props}
        />
        <InnerBorder opacity={0.04} radius={8} zIndex={2} />
      </Centered>
    )
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
  withThemeContext(
    ({ item, isFirstRow, onPress, selected, subtitle, testID, ...props }) => (
      <Fragment>
        {isFirstRow && (
          <Centered height={dividerHeight}>
            <Divider color={props.colors.rowDividerLight} />
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
            testID={testID + item.name}
            topRowRender={TopRow}
          />
        </ButtonPressAnimation>
      </Fragment>
    )
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
