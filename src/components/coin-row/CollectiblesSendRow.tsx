import PropTypes from 'prop-types';
import React, { Fragment, useMemo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { css } from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils, magicMemo } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const dividerHeight = 22;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
const isTinyPhone = deviceUtils.dimensions.height <= 568;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const selectedStyles = css`
  ${isTinyPhone ? padding(10, 0, 0) : isSmallPhone ? padding(12) : padding(15)};
  height: ${selectedHeight};
`;

const BottomRow = ({ selected, subtitle }: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

const TopRow = ({ id, name, selected }: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <CoinName
      color={colors.dark}
      size={selected ? 'large' : 'lmedium'}
      weight={selected ? 'bold' : 'regular'}
    >
      {name || `#${id}`}
    </CoinName>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
const UniqueTokenCoinIcon = magicMemo(
  ({
    collection: { name },
    background,
    image_thumbnail_url,
    selected,
    shouldPrioritizeImageLoading,
    ...props
  }: any) => {
    const { colors } = useTheme();
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'propTypes' does not exist on type 'MemoE... Remove this comment to see the full error message
UniqueTokenCoinIcon.propTypes = {
  asset_contract: PropTypes.shape({ name: PropTypes.string }),
  background: PropTypes.string,
  image_thumbnail_url: PropTypes.string,
  shouldPrioritizeImageLoading: PropTypes.bool,
};

const arePropsEqual = (props: any, nextProps: any) =>
  buildAssetUniqueIdentifier(props.item) !==
  buildAssetUniqueIdentifier(nextProps.item);

// eslint-disable-next-line react/display-name
const CollectiblesSendRow = React.memo(
  ({
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'disablePressAnimation' does not exist on... Remove this comment to see the full error message
    disablePressAnimation,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'item' does not exist on type '{ children... Remove this comment to see the full error message
    item,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isFirstRow' does not exist on type '{ ch... Remove this comment to see the full error message
    isFirstRow,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onPress' does not exist on type '{ child... Remove this comment to see the full error message
    onPress,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'selected' does not exist on type '{ chil... Remove this comment to see the full error message
    selected,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'testID' does not exist on type '{ childr... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Fragment>
        {isFirstRow && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Centered height={dividerHeight}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerLight} />
          </Centered>
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Wrapper onPress={onPress} scaleTo={0.96}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'propTypes' does not exist on type 'Named... Remove this comment to see the full error message
CollectiblesSendRow.propTypes = {
  isFirstRow: PropTypes.bool,
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
  subtitle: PropTypes.string,
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'dividerHeight' does not exist on type 'N... Remove this comment to see the full error message
CollectiblesSendRow.dividerHeight = dividerHeight;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedHeight' does not exist on type '... Remove this comment to see the full error message
CollectiblesSendRow.selectedHeight = selectedHeight;

export default CollectiblesSendRow;
