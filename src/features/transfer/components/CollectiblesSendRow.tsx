import React, { Fragment, useMemo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RequestVendorLogoIcon from '@/components/coin-icon/RequestVendorLogoIcon';
import CoinName from '@/components/coin-row/CoinName';
import CoinRow from '@/components/coin-row/CoinRow';
import Divider from '@/components/Divider';
import { Centered } from '@/components/layout';
import { TruncatedText } from '@/components/text';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { opacity } from '@/framework/ui/utils/opacity';
import svgToPngIfNeeded from '@/handlers/svgs';
import { buildAssetUniqueIdentifier } from '@/helpers/assets';
import { padding } from '@/styles';
import { useTheme } from '@/theme/ThemeContext';
import deviceUtils from '@/utils/deviceUtils';
import magicMemo from '@/utils/magicMemo';

const dividerHeight = 22;
const isSmallPhone = deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : isSmallPhone ? 64 : 70;

const selectedStyles = {
  height: selectedHeight,
  ...(isTinyPhone ? padding.object(10, 0, 0) : isSmallPhone ? padding.object(12) : padding.object(15)),
};

const BottomRow = ({ selected, subtitle }: { selected: boolean; subtitle: string }) => {
  const { colors } = useTheme();

  return (
    <TruncatedText
      color={selected ? opacity(colors.blueGreyDark, 0.6) : opacity(colors.blueGreyDark, 0.5)}
      letterSpacing="roundedMedium"
      size="smedium"
      weight={selected ? 'bold' : 'regular'}
    >
      {subtitle}
    </TruncatedText>
  );
};

const TopRow = ({ tokenId, name, selected }: { tokenId: string; name: string; selected: boolean }) => {
  const { colors } = useTheme();

  return (
    <CoinName color={colors.dark} size={selected ? 'large' : 'lmedium'} weight={selected ? 'bold' : 'regular'}>
      {name || `#${tokenId}`}
    </CoinName>
  );
};

const UniqueTokenCoinIcon = magicMemo(
  asset => {
    const { collectionName, backgroundColor, images, selected, shouldPrioritizeImageLoading, ...props } = asset;
    const { colors } = useTheme();
    const imageUrl = svgToPngIfNeeded(images.lowResUrl || images.highResUrl, true);
    return (
      <Centered>
        <RequestVendorLogoIcon
          backgroundColor={backgroundColor || colors.lightestGrey}
          borderRadius={10}
          dappName={collectionName}
          imageUrl={imageUrl}
          noShadow={selected}
          shouldPrioritizeImageLoading={shouldPrioritizeImageLoading}
          {...props}
          badgeYPosition={-4}
        />
      </Centered>
    );
  },
  ['backgroundColor', 'images.lowResUrl', 'images.highResUrl']
);

export const CollectiblesSendRow = React.memo(
  ({
    disablePressAnimation,
    item,
    isFirstRow,
    onPress,
    selected,
    testID,
    ...props
  }: {
    disablePressAnimation?: boolean;
    item: UniqueAsset;
    isFirstRow?: boolean;
    onPress: () => void;
    selected?: boolean;
    testID: string;
  }) => {
    const { colors } = useTheme();

    const subtitle = useMemo(() => (item.name ? item.name : item.collectionName), [item.collectionName, item.name]);

    const Wrapper = disablePressAnimation ? TouchableWithoutFeedback : ButtonPressAnimation;

    return (
      <Fragment>
        {isFirstRow && (
          <Centered height={dividerHeight}>
            <Divider color={colors.rowDividerLight} />
          </Centered>
        )}
        <Wrapper onPress={onPress} scaleTo={0.96}>
          {/* @ts-expect-error JavaScript component */}
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
        </Wrapper>
      </Fragment>
    );
  },
  (props, nextProps) => buildAssetUniqueIdentifier(props.item) !== buildAssetUniqueIdentifier(nextProps.item)
);

CollectiblesSendRow.displayName = 'CollectiblesSendRow';
// @ts-expect-error
CollectiblesSendRow.dividerHeight = dividerHeight;
// @ts-expect-error
CollectiblesSendRow.selectedHeight = selectedHeight;
