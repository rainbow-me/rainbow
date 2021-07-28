import PropTypes from 'prop-types';
import React, { Fragment, useMemo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { padding } from '@rainbow-me/styles';

const dividerHeight = 22;
const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const selectedStyles = css`
  ${isTinyPhone ? padding(10, 0, 0) : isSmallPhone ? padding(12) : padding(15)};
  height: ${selectedHeight};
`;

const BottomRow = ({ selected, subtitle }) => {
  const { colors } = useTheme();

  return (
    <TruncatedText
      color={
        selected
          ? colors.alpha(colors.blueGreyDark, 0.6)
          : colors.alpha(colors.blueGreyDark, 0.5)
      }
      letterSpacing="roundedMedium"
      size="smedium"
      weight={selected ? 'bold' : 'regular'}
    >
      {subtitle}
    </TruncatedText>
  );
};

const TopRow = ({ id, name, selected }) => {
  const { colors } = useTheme();

  return (
    <CoinName
      color={colors.dark}
      size={selected ? 'large' : 'lmedium'}
      weight={selected ? 'bold' : 'regular'}
    >
      {name || `#${id}`}
    </CoinName>
  );
};

const UniqueTokenCoinIcon = magicMemo(
  ({
    collection: { name },
    background,
    image_thumbnail_url,
    selected,
    shouldPrioritizeImageLoading,
    ...props
  }) => {
    const { colors } = useTheme();
    return (
      <Centered>
        <RequestVendorLogoIcon
          backgroundColor={background || colors.lightestGrey}
          borderRadius={10}
          dappName={name}
          imageUrl={image_thumbnail_url}
          noShadow={selected}
          shouldPrioritizeImageLoading={shouldPrioritizeImageLoading}
          {...props}
        />
      </Centered>
    );
  },
  ['background', 'image_thumbnail_url']
);

UniqueTokenCoinIcon.propTypes = {
  asset_contract: PropTypes.shape({ name: PropTypes.string }),
  background: PropTypes.string,
  image_thumbnail_url: PropTypes.string,
  shouldPrioritizeImageLoading: PropTypes.bool,
};

const arePropsEqual = (props, nextProps) =>
  buildAssetUniqueIdentifier(props.item) !==
  buildAssetUniqueIdentifier(nextProps.item);

// eslint-disable-next-line react/display-name
const CollectiblesSendRow = React.memo(
  ({
    disablePressAnimation,
    item,
    isFirstRow,
    onPress,
    selected,
    testID,
    ...props
  }) => {
    const { colors } = useTheme();
    const subtitle = useMemo(
      () =>
        item.name
          ? `${item.collection.name} #${item.id}`
          : item.collection.name,

      [item.collection.name, item.id, item.name]
    );

    const Wrapper = disablePressAnimation
      ? TouchableWithoutFeedback
      : ButtonPressAnimation;

    return (
      <Fragment>
        {isFirstRow && (
          <Centered height={dividerHeight}>
            <Divider color={colors.rowDividerLight} />
          </Centered>
        )}
        <Wrapper onPress={onPress} scaleTo={0.96}>
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
  arePropsEqual
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
