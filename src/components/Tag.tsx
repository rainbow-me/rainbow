import { upperCase, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import { magicMemo, showActionSheetWithOptions } from '../utils';
import { ButtonPressAnimation } from './animations';
import { Centered, Column } from './layout';
import { Text as TextElement } from './text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
  flex: none;
  overflow: hidden;
  z-index: 2;
`;

const Text = styled(TextElement).attrs(({ theme: { colors } }) => ({
  color: colors.whiteLabel,
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

const Tag = ({ color, slug, text, title, ...props }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const onPressAndroid = useCallback(() => {
    const androidContractActions = ['View All With Property'];

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      (idx: any) => {
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
  }, []);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContextMenuButton
      activeOpacity={0}
      menuConfig={menuConfig}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {...(android ? { onPress: onPressAndroid } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <OuterBorder {...props} color={color}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Container>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Title color={color}>{upperCase(title)}</Title>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(Tag, ['color', 'slug', 'text', 'title']);
