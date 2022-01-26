import { upperCase, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import { magicMemo, showActionSheetWithOptions } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Centered, Column } from './layout';
import { Text as TextElement } from './text';
import { Row } from '@rainbow-me/design-system';
import { padding } from '@rainbow-me/styles';

const HairlineSpace = '\u200a';

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

const Container = styled(Column)`
  ${padding(8, 10)};
  border-radius: ${TagBorderRadius};
  text-align: left;
  z-index: 1;
`;

const OuterBorder = styled(Centered)`
  border-color: ${({ color, theme: { colors } }) =>
    color || colors.alpha(colors.whiteLabel, 0.15)};
  border-radius: ${TagBorderRadius};
  border-width: 2;
  flex: 0;
  overflow: hidden;
  z-index: 2;
`;

const Text = styled(TextElement).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.whiteLabel,
  size: 'lmedium',
  weight: 'semibold',
}))`
  line-height: 18;
`;

const Title = styled(TextElement).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.alpha(colors.whiteLabel, 0.5),
  size: 'tiny',
  weight: 'heavy',
}))`
  line-height: 13;
  margin-bottom: 1;
`;

const Tag = ({ color, disableMenu, slug, text, title, maxValue, ...props }) => {
  const { colors } = useTheme();

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
            <Row>
              <Text>{upperFirst(text)}</Text>
              {maxValue && (
                <Text>
                  <Text color={colors.alpha(colors.whiteLabel, 0.8)}>
                    {HairlineSpace}/{HairlineSpace}
                  </Text>
                  {maxValue}
                </Text>
              )}
            </Row>
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

export default magicMemo(Tag, ['color', 'slug', 'text', 'title', 'maxValue']);
