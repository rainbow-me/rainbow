import React, { Fragment, useMemo } from 'react';
import { PressableProps, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils, magicMemo } from '../../utils';
import Divider from '@/components/Divider';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { UniqueAsset } from '@/entities';
import svgToPngIfNeeded from '@/handlers/svgs';
import { padding } from '@/styles';

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
      color={selected ? colors.alpha(colors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.5)}
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

const CollectiblesSendRow = React.memo(
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
    onPress: PressableProps['onPress'];
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

export default CollectiblesSendRow;
