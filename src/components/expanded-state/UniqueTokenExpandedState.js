import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useShowcaseTokens } from '../../hooks';
import { colors } from '../../styles';
import { magicMemo } from '../../utils';
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
import { ShowcaseToast } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateHeader,
  UniqueTokenExpandedStateImage,
} from './unique-token';

const ToastContainer = styled(Column).attrs({
  pointerEvents: 'none',
})`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
`;

const UniqueTokenExpandedState = ({ asset }) => {
  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const isShowcaseAsset = useMemo(() => {
    return showcaseTokens.includes(asset.uniqueId);
  }, [asset.uniqueId, showcaseTokens]);

  const handlePressShowcase = useCallback(() => {
    if (isShowcaseAsset) {
      removeShowcaseToken(asset.uniqueId);
    } else {
      addShowcaseToken(asset.uniqueId);
    }
  }, [addShowcaseToken, asset.uniqueId, isShowcaseAsset, removeShowcaseToken]);

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
          {asset.isSendable && <SendActionButton />}
        </SheetActionButtonRow>
        <SheetDivider />
        <ColumnWithDividers dividerRenderer={SheetDivider}>
          {!!asset.description && (
            <ExpandedStateSection title="Bio">
              {asset.description}
            </ExpandedStateSection>
          )}
          {!!asset.traits.length && (
            <ExpandedStateSection paddingBottom={14} title="Attributes">
              <UniqueTokenAttributes {...asset} />
            </ExpandedStateSection>
          )}
          {!!asset.asset_contract.description && (
            <ExpandedStateSection title={`About ${asset.asset_contract.name}`}>
              <Column align="start">
                <Text
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="lmedium"
                >
                  {asset.asset_contract.description}
                </Text>
                <Link url={asset.asset_contract.external_link} />
              </Column>
            </ExpandedStateSection>
          )}
        </ColumnWithDividers>
      </SlackSheet>
      <ToastContainer>
        <ShowcaseToast isShowcaseAsset={isShowcaseAsset} />
      </ToastContainer>
    </Fragment>
  );
};

UniqueTokenExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
