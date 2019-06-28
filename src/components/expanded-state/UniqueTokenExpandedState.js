import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager, Linking, Share } from 'react-native';
import {
  compose,
  onlyUpdateForPropTypes,
  withHandlers,
  withProps,
} from 'recompact';
import { buildUniqueTokenName } from '../../helpers/assets';
import { withImageDimensionsCache } from '../../hoc';
import { colors } from '../../styles';
import {
  deviceUtils,
  dimensionsPropType,
  safeAreaInsetValues,
} from '../../utils';
import { Centered } from '../layout';
import { Pager } from '../pager';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import {
  AssetPanel,
  AssetPanelAction,
  AssetPanelHeader,
} from './asset-panel';
import FloatingPanel from './FloatingPanel';
import FloatingPanels from './FloatingPanels';

const PagerControlsColorVariants = {
  dark: colors.dark,
  light: colors.white,
};

const UniqueTokenExpandedState = ({
  asset,
  containerHeight,
  containerWidth,
  imageDimensions,
  maxImageHeight,
  onLayout,
  onPressSend,
  onPressShare,
  onPressView,
  panelColor,
  panelHeight,
  panelWidth,
  subtitle,
  title,
}) => {
  const PanelPages = [{
    component: (
      <UniqueTokenImage
        backgroundColor={asset.background}
        borderRadius={FloatingPanel.borderRadius}
        imageUrl={asset.image_preview_url}
        item={asset}
        resizeMode="contain"
      />
    ),
    name: 'UniqueTokenImage',
  }];

  if (asset.traits.length) {
    PanelPages.push({
      component: <UniqueTokenAttributes {...asset} />,
      name: 'UniqueTokenAttributes',
    });
  }

  return (
    <FloatingPanels>
      {!!maxImageHeight && (
        <Centered>
          <FloatingPanel color={panelColor} height={panelHeight} width={panelWidth}>
            {/*
                TODO XXX: THIS FLOATING PANEL SHOULD HAVE HORIZONTAL PADDING
                IF THE IMAGE IS A PERFECT SQUARE
            */}
            <Pager
              controlsProps={{
                bottom: UniqueTokenAttributes.padding,
                color: colors.getTextColorForBackground(panelColor, PagerControlsColorVariants),
              }}
              dimensions={{ height: panelHeight, width: panelWidth }}
              pages={PanelPages}
            />
          </FloatingPanel>
        </Centered>
      )}
      <AssetPanel onLayout={onLayout}>
        <AssetPanelHeader
          subtitle={subtitle}
          title={title}
        />
        {asset.isSendable && (
          <AssetPanelAction
            icon="send"
            label="Send to..."
            onPress={onPressSend}
          />
        )}
        <AssetPanelAction
          icon="compass"
          label="View on OpenSea"
          onPress={onPressView}
        />
        <AssetPanelAction
          icon="share"
          label="Share"
          onPress={onPressShare}
        />
      </AssetPanel>
    </FloatingPanels>
  );
};

UniqueTokenExpandedState.propTypes = {
  asset: PropTypes.object,
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number,
  imageDimensions: dimensionsPropType,
  maxImageHeight: PropTypes.number,
  onLayout: PropTypes.func.isRequired,
  onPressSend: PropTypes.func,
  onPressShare: PropTypes.func,
  onPressView: PropTypes.func,
  panelColor: PropTypes.string,
  panelHeight: PropTypes.number.isRequired,
  panelWidth: PropTypes.number.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

const buildPanelDimensions = ({
  asset: { background },
  imageDimensions,
  maxImageHeight,
  panelWidth,
}) => {
  const panelHeight = imageDimensions
    ? ((panelWidth * imageDimensions.height) / imageDimensions.width)
    : panelWidth;

  const panelDimensions = { panelHeight };

  if (panelHeight > maxImageHeight) {
    panelDimensions.panelHeight = maxImageHeight;
    panelDimensions.panelWidth = background
      ? panelWidth
      : ((maxImageHeight * imageDimensions.width) / imageDimensions.height);
  }

  return panelDimensions;
};

export default compose(
  withImageDimensionsCache,
  withViewLayoutProps(({ height: siblingHeight }) => {
    const { bottom, top } = safeAreaInsetValues;

    const viewportPadding = (bottom ? (bottom + top) : (top + top));
    const viewportHeight = deviceUtils.dimensions.height - viewportPadding;
    const maxImageHeight = viewportHeight - siblingHeight - FloatingPanels.margin;

    return { maxImageHeight };
  }),
  withProps(({ asset, imageDimensionsCache }) => ({
    imageDimensions: imageDimensionsCache[asset.image_preview_url],
    panelColor: asset.background || colors.lightestGrey,
    subtitle: asset.name
      ? `${asset.asset_contract.name} #${asset.id}`
      : asset.asset_contract.name,
    title: buildUniqueTokenName(asset),
  })),
  withProps(buildPanelDimensions),
  withHandlers({
    onPressSend: ({ asset, navigation }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset });
      });
    },
    onPressShare: ({ asset: { name, permalink } }) => () => {
      Share.share({
        title: `Share ${name} Info`,
        url: permalink,
      });
    },
    onPressView: ({ asset: { permalink } }) => () => {
      Linking.openURL(permalink);
    },
  }),
  onlyUpdateForPropTypes,
)(UniqueTokenExpandedState);
