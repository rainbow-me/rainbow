import styled from '@terrysahaidak/style-thing';
import { upperCase, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { magicMemo, showActionSheetWithOptions } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Centered, Column } from './layout';
import { Text as TextElement } from './text';
import { padding } from '@rainbow-me/styles';

const PropertyActionsEnum = {
  viewTraitOnOpensea: 'viewTraitOnOpensea',
};

const viewTraitOnOpenseaAction = {
  actionKey: PropertyActionsEnum.viewTraitOnOpensea,
  actionTitle: 'View All With Property',
  discoverabilityTitle: 'OpenSea',
  icon: {
    iconType: 'SYSTEM',
    iconValue: 'magnifyingglass.circle.fill',
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
  borderColor: ({ color, theme: { colors } }) =>
    color || colors.alpha(colors.whiteLabel, 0.15),
  borderRadius: TagBorderRadius,
  borderWidth: 2,
  // flex: 0,
  overflow: 'hidden',
  zIndex: 2,
});

const Text = styled(TextElement).attrs(({ theme: { colors } }) => ({
  color: colors.whiteLabel,
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

const Tag = ({ color, disableMenu, slug, text, title, ...props }) => {
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === PropertyActionsEnum.viewTraitOnOpensea) {
        Linking.openURL(
          'https://opensea.io/collection/' +
            slug +
            '?search[stringTraits][0][name]=' +
            title +
            '&search[stringTraits][0][values][0]=' +
            text
        );
      }
    },
    [slug, text, title]
  );

  const menuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          ...viewTraitOnOpenseaAction,
        },
      ],
      menuTitle: '',
    };
  }, []);

  const onPressAndroid = useCallback(() => {
    const androidContractActions = ['View All With Property'];

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      idx => {
        if (idx === 0) {
          Linking.openURL(
            'https://opensea.io/collection/' +
              slug +
              '?search[stringTraits][0][name]=' +
              title +
              '&search[stringTraits][0][values][0]=' +
              text
          );
        }
      }
    );
  }, [slug, text, title]);

  return (
    <ContextMenuButton
      activeOpacity={0}
      enableContextMenu={!disableMenu}
      menuConfig={menuConfig}
      {...(android ? { onPress: onPressAndroid } : {})}
      isMenuPrimaryAction={!disableMenu}
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      <ButtonPressAnimation>
        <OuterBorder {...props} color={color}>
          <Container>
            <Title color={color}>{upperCase(title)}</Title>
            <Text>{upperFirst(text)}</Text>
          </Container>
        </OuterBorder>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
};

Tag.propTypes = {
  color: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default magicMemo(Tag, ['color', 'slug', 'text', 'title']);
