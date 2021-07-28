import React, { Fragment, useCallback, useMemo } from 'react';
import { Share } from 'react-native';
import styled from 'styled-components';
import useWallets from '../../hooks/useWallets';
import Link from '../Link';
import { Column, ColumnWithDividers } from '../layout';
import {
  SendActionButton,
  SheetActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
} from '../sheet';
import { MarkdownText } from '../text';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
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

const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom + 20};
`;

const UniqueTokenExpandedState = ({ asset, external }) => {
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
          <SheetActionButtonRow>
            <SheetActionButton
              color={isDarkMode ? colors.darkModeDark : colors.dark}
              label={isShowcaseAsset ? '􀁏 Showcase' : '􀁍 Showcase'}
              onPress={handlePressShowcase}
              weight="bold"
            />
            {isSendable && <SendActionButton />}
          </SheetActionButtonRow>
        ) : (
          <SheetActionButtonRow>
            <SheetActionButton
              color={isDarkMode ? colors.darkModeDark : colors.dark}
              label="􀈂 Share"
              onPress={handlePressShare}
              weight="bold"
            />
          </SheetActionButtonRow>
        )}
        <SheetDivider />
        <ColumnWithDividers dividerRenderer={SheetDivider}>
          {!!description && (
            <ExpandedStateSection title="Description">
              {description}
            </ExpandedStateSection>
          )}
          {!!traits.length && (
            <ExpandedStateSection paddingBottom={14} title="Attributes">
              <UniqueTokenAttributes {...asset} />
            </ExpandedStateSection>
          )}
          {!!familyDescription && (
            <ExpandedStateSection title={`About ${familyName}`}>
              <Column>
                <MarkdownText
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="lmedium"
                >
                  {familyDescription}
                </MarkdownText>
                {familyLink && <Link url={familyLink} />}
              </Column>
            </ExpandedStateSection>
          )}
        </ColumnWithDividers>
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
