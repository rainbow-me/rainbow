import React, { Fragment, useCallback, useMemo } from 'react';
import { Share, View } from 'react-native';
import styled from 'styled-components';
import useWallets from '../../hooks/useWallets';
import Link from '../Link';
import {
  SendActionButton,
  SheetActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
} from '../sheet';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import { useTheme } from '@rainbow-me/context';
import {
  Heading,
  Inset,
  MarkdownText,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
import {
  useAccountProfile,
  useDimensions,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import {
  buildRainbowUrl,
  magicMemo,
  safeAreaInsetValues,
} from '@rainbow-me/utils';

const Spacer = styled(View)`
  height: ${safeAreaInsetValues.bottom + 20};
`;

interface UniqueTokenAsset {
  id: string;
  name: string | undefined;
  collection: {
    name: string;
    description?: string;
    external_link?: string;
  };
  description?: string;
  familyName: string;
  isSendable?: boolean;
  traits?: {
    trait_type: string;
    value: string;
  }[];
  uniqueId: string;
}

const UniqueTokenExpandedState = ({
  asset,
  external,
}: {
  asset: UniqueTokenAsset;
  external: boolean;
}) => {
  const {
    collection: { description: familyDescription, external_link: familyLink },
    description,
    familyName,
    isSendable,
    traits,
    uniqueId,
  } = asset;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const { isReadOnlyWallet } = useWallets();

  const isShowcaseAsset = useMemo(() => showcaseTokens.includes(uniqueId), [
    showcaseTokens,
    uniqueId,
  ]);

  const handlePressShowcase = useCallback(() => {
    if (isShowcaseAsset) {
      removeShowcaseToken(uniqueId);
    } else {
      addShowcaseToken(uniqueId);
    }
  }, [addShowcaseToken, isShowcaseAsset, removeShowcaseToken, uniqueId]);

  const { accountAddress, accountENS } = useAccountProfile();

  const handlePressShare = useCallback(() => {
    Share.share({
      title: `Share ${buildUniqueTokenName(asset)} Info`,
      url: buildRainbowUrl(asset, accountENS, accountAddress),
    });
  }, [accountAddress, accountENS, asset]);

  const { height: screenHeight } = useDimensions();
  const { colors, isDarkMode } = useTheme();

  return (
    <Fragment>
      {/* @ts-expect-error */}
      <SlackSheet
        bottomInset={42}
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
        scrollEnabled
      >
        <UniqueTokenExpandedStateHeader asset={asset} />
        <UniqueTokenExpandedStateContent asset={asset} />
        {!external && !isReadOnlyWallet ? (
          // @ts-expect-error
          <SheetActionButtonRow>
            {/* @ts-expect-error */}
            <SheetActionButton
              // @ts-expect-error
              color={isDarkMode ? colors.darkModeDark : colors.dark}
              label={isShowcaseAsset ? '􀁏 Showcase' : '􀁍 Showcase'}
              onPress={handlePressShowcase}
              weight="bold"
            />
            {isSendable && (
              // @ts-expect-error
              <SendActionButton asset={asset} />
            )}
          </SheetActionButtonRow>
        ) : (
          // @ts-expect-error
          <SheetActionButtonRow>
            {/* @ts-expect-error */}
            <SheetActionButton
              // @ts-expect-error
              color={isDarkMode ? colors.darkModeDark : colors.dark}
              label="􀈂 Share"
              onPress={handlePressShare}
              weight="bold"
            />
          </SheetActionButtonRow>
        )}
        <SheetDivider />
        <Stack separator={<SheetDivider />}>
          {!!description && (
            <Inset horizontal="19dp" vertical="24dp">
              <Stack space="24dp">
                <Heading>Description</Heading>
                <Text color="secondary50">{description}</Text>
              </Stack>
            </Inset>
          )}
          {!!traits && traits.length > 0 && (
            <Inset horizontal="19dp" vertical="24dp">
              <Stack space="24dp">
                <Heading>Attributes</Heading>
                <UniqueTokenAttributes {...asset} />
              </Stack>
            </Inset>
          )}
          {!!familyDescription && (
            <Inset horizontal="19dp" vertical="24dp">
              <Stack space="24dp">
                <Heading>About {familyName}</Heading>
                <MarkdownText nestedSpace="19dp" space="24dp">
                  {familyDescription}
                </MarkdownText>
                {familyLink && <Link url={familyLink} />}
              </Stack>
            </Inset>
          )}
        </Stack>
        <Spacer />
      </SlackSheet>
      <ToastPositionContainer>
        <ToggleStateToast
          addCopy="Added to showcase"
          isAdded={isShowcaseAsset}
          removeCopy="Removed from showcase"
        />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
