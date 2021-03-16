import React, { Fragment, useCallback, useMemo } from 'react';
import Link from '../Link';
import { Column, ColumnWithDividers } from '../layout';
import {
  SendActionButton,
  SheetActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
} from '../sheet';
import { Text } from '../text';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import { useDimensions, useShowcaseTokens } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const UniqueTokenExpandedState = ({ asset }) => {
  const {
    asset_contract: {
      description: familyDescription,
      external_link: familyLink,
      name: familyName,
    },
    description,
    isSendable,
    traits,
    uniqueId,
  } = asset;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

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
        <SheetActionButtonRow>
          <SheetActionButton
            color={isDarkMode ? colors.darkModeDark : colors.dark}
            label={isShowcaseAsset ? '􀁏 Showcase' : '􀁍 Showcase'}
            onPress={handlePressShowcase}
            weight="bold"
          />
          {isSendable && <SendActionButton />}
        </SheetActionButtonRow>
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
                <Text
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="lmedium"
                >
                  {familyDescription}
                </Text>
                {familyLink && <Link url={familyLink} />}
              </Column>
            </ExpandedStateSection>
          )}
        </ColumnWithDividers>
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
