import React, { Fragment, useMemo } from 'react';
import { PressableProps, TouchableWithoutFeedback } from 'react-native';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils, getUniqueTokenType, magicMemo } from '../../utils';
import Divider from '../Divider';
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
const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

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

const TopRow = ({ id, name, selected }: { id: number; name: string; selected: boolean }) => {
  const { colors } = useTheme();

  return (
    <CoinName color={colors.dark} size={selected ? 'large' : 'lmedium'} weight={selected ? 'bold' : 'regular'}>
      {name || `#${id}`}
    </CoinName>
  );
};

const UniqueTokenCoinIcon = magicMemo(
  asset => {
    const {
      collection: { name },
      background,
      image_thumbnail_url,
      image_url,
      selected,
      shouldPrioritizeImageLoading,
      ...props
    } = asset;
    const { colors } = useTheme();
    const imageUrl = svgToPngIfNeeded(image_thumbnail_url || image_url, true);
    return (
      <Centered>
        <RequestVendorLogoIcon
          backgroundColor={background || colors.lightestGrey}
          borderRadius={10}
          dappName={name}
          imageUrl={imageUrl}
          noShadow={selected}
          shouldPrioritizeImageLoading={shouldPrioritizeImageLoading}
          {...props}
          badgeYPosition={-4}
        />
      </Centered>
    );
  },
  ['background', 'image_thumbnail_url']
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

    const uniqueTokenType = getUniqueTokenType(item);
    const isENS = uniqueTokenType === 'ENS';

    const subtitle = useMemo(
      () => (item.name && !isENS ? `${item.collection.name} #${item.id}` : item.collection.name),

      [isENS, item.collection.name, item.id, item.name]
    );

    const Wrapper = disablePressAnimation ? TouchableWithoutFeedback : ButtonPressAnimation;

    return (
      <Fragment>
        {isFirstRow && (
          <Centered height={dividerHeight}>
            {/* @ts-expect-error JavaScript component */}
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
