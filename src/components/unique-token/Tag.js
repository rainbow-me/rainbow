import lang from 'i18n-js';
import { upperCase, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import { Centered, Column } from '../layout';
import { Text as TextElement } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Inline } from '@/design-system';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo, showActionSheetWithOptions } from '@/utils';

const HairlineSpace = '\u200a';

const PropertyActionsEnum = {
  openURL: 'openURL',
  viewTraitOnNftMarketplace: 'viewTraitOnNftMarketplace',
};

const getViewTraitOnNftMarketplaceAction = marketplaceName => {
  return {
    actionKey: PropertyActionsEnum.viewTraitOnNftMarketplace,
    actionTitle: lang.t('expanded_state.unique_expanded.view_all_with_property'),
    discoverabilityTitle: marketplaceName,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'magnifyingglass.circle.fill',
    },
  };
};

const openTraitURLInBrowserAction = {
  actionKey: PropertyActionsEnum.openURL,
  actionTitle: lang.t('expanded_state.unique_expanded.open_in_web_browser'),
  icon: {
    iconType: 'SYSTEM',
    iconValue: 'safari.fill',
  },
};

const TagBorderRadius = 16;

const Container = styled(Column)({
  ...padding.object(8, 10),
  borderRadius: TagBorderRadius,
  textAlign: 'left',
  zIndex: 1,
});

const OuterBorder = styled(Centered)({
  borderColor: ({ color, theme: { colors } }) => color || colors.alpha(colors.whiteLabel, 0.15),
  borderRadius: TagBorderRadius,
  borderWidth: 2,
  flex: 0,
  overflow: 'hidden',
  zIndex: 2,
});

const Text = styled(TextElement).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.whiteLabel,
  size: 'lmedium',
  weight: 'semibold',
}))({
  lineHeight: 18,
});

const Title = styled(TextElement).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.alpha(colors.whiteLabel, 0.5),
  size: 'tiny',
  weight: 'heavy',
}))({
  lineHeight: 13,
  marginBottom: 1,
});

const getNftTraitUrl = (marketplaceId, collectionId, traitTitle, traitValue) => {
  switch (marketplaceId) {
    case 'stratos':
      return `https://stratosnft.io/collection/${collectionId}?attributes=${traitTitle}:${traitValue}`;
    case 'quixotic':
      return `https://qx.app/collection/${collectionId}?attributes=${traitTitle}:${traitValue}`;
    case 'trove':
      return `https://trove.treasure.lol/collection/${collectionId}?trait%5B%5D=${traitTitle}%3A${traitValue}`;
    default:
      return `https://opensea.io/collection/${collectionId}?search[stringTraits][0][name]=${traitTitle}&search[stringTraits][0][values][0]=${traitValue}`;
  }
};

const Tag = ({
  color,
  disableMenu,
  slug,
  text,
  title,
  marketplaceId,
  marketplaceName,
  maxValue,
  originalValue,
  lowercase,
  hideNftMarketplaceAction,
  ...props
}) => {
  const { colors } = useTheme();
  const isURL = typeof originalValue === 'string' && originalValue.toLowerCase().startsWith('https://');

  const viewTraitOnNftMarketplaceAction = getViewTraitOnNftMarketplaceAction(marketplaceName);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === PropertyActionsEnum.viewTraitOnNftMarketplace) {
        const nftTraitUrl = getNftTraitUrl(marketplaceId, slug, title, originalValue);
        Linking.openURL(nftTraitUrl);
      } else if (actionKey === PropertyActionsEnum.openURL) {
        Linking.openURL(originalValue);
      }
    },
    [slug, originalValue, marketplaceId, title]
  );

  const onPressAndroid = useCallback(() => {
    const androidContractActions = [];

    if (!hideNftMarketplaceAction) {
      androidContractActions.push(viewTraitOnNftMarketplaceAction.actionTitle);
    }

    if (isURL) {
      androidContractActions.push(openTraitURLInBrowserAction.actionTitle);
    }

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      idx => {
        if (androidContractActions[idx] === viewTraitOnNftMarketplaceAction.actionTitle) {
          const nftTraitUrl = getNftTraitUrl(marketplaceId, slug, title, originalValue);
          Linking.openURL(nftTraitUrl);
        } else if (androidContractActions[idx] === openTraitURLInBrowserAction.actionTitle) {
          Linking.openURL(originalValue);
        }
      }
    );
  }, [hideNftMarketplaceAction, isURL, slug, title, originalValue, marketplaceId, viewTraitOnNftMarketplaceAction.actionTitle]);

  const menuConfig = useMemo(() => {
    const menuItems = [];

    if (!hideNftMarketplaceAction) {
      menuItems.push(viewTraitOnNftMarketplaceAction);
    }

    if (isURL) {
      menuItems.push(openTraitURLInBrowserAction);
    }

    return {
      menuItems,
      menuTitle: '',
    };
  }, [hideNftMarketplaceAction, isURL, viewTraitOnNftMarketplaceAction]);

  const textWithUpdatedCase = lowercase ? text : upperFirst(text);

  const ButtonWrapper = ({ children }) =>
    disableMenu || menuConfig.menuItems.length === 0 ? (
      children
    ) : (
      <ContextMenuButton
        activeOpacity={0}
        menuConfig={menuConfig}
        {...(android ? { onPress: onPressAndroid } : {})}
        enableContextMenu
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        <ButtonPressAnimation>{children}</ButtonPressAnimation>
      </ContextMenuButton>
    );

  return (
    <ButtonWrapper>
      <OuterBorder {...props} color={color}>
        <Container>
          <Title color={color}>{upperCase(title)}</Title>
          <Inline wrap={false}>
            <Text>{textWithUpdatedCase}</Text>
            {maxValue && (
              <Text>
                <Text color={colors.alpha(colors.whiteLabel, 0.8)}>
                  {HairlineSpace}/{HairlineSpace}
                </Text>
                {maxValue}
              </Text>
            )}
          </Inline>
        </Container>
      </OuterBorder>
    </ButtonWrapper>
  );
};

Tag.propTypes = {
  color: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default magicMemo(Tag, [
  'color',
  'slug',
  'text',
  'title',
  'marketplaceId',
  'marketplaceName',
  'maxValue',
  'originalValue',
  'hideNftMarketplaceAction',
]);
