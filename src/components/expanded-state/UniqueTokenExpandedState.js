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
import { ShowcaseToast, ToastPositionContainer } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateHeader,
  UniqueTokenExpandedStateImage,
} from './unique-token';
import { useShowcaseTokens } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';
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

  return (
    <Fragment>
      <SlackSheet height="100%">
        <UniqueTokenExpandedStateHeader asset={asset} />
        <UniqueTokenExpandedStateImage asset={asset} />
        <SheetActionButtonRow>
          <SheetActionButton
            color={colors.dark}
            emoji="trophy"
            label={isShowcaseAsset ? 'Remove' : 'Add'}
            onPress={handlePressShowcase}
          />
          {isSendable && <SendActionButton />}
        </SheetActionButtonRow>
        <SheetDivider />
        <ColumnWithDividers dividerRenderer={SheetDivider}>
          {!!description && (
            <ExpandedStateSection title="Bio">
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
        <ShowcaseToast isShowcaseAsset={isShowcaseAsset} />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
