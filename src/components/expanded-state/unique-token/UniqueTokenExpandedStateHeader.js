import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Linking, Share } from 'react-native';
import styled from 'styled-components/primitives';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { magicMemo } from '../../../utils';
import Pill from '../../Pill';
import { ContextCircleButton } from '../../context-menu';
import { ColumnWithMargins, FlexItem, Row, RowWithMargins } from '../../layout';
import { Text } from '../../text';
import { colors, padding } from '@rainbow-me/styles';

const contextButtonOptions = [
  'Share',
  'View on OpenSea',
  ...(ios ? [lang.t('wallet.action.cancel')] : []),
];

const paddingHorizontal = 19;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(14, paddingHorizontal, paddingHorizontal)};
`;

const HeadingColumn = styled(ColumnWithMargins).attrs({
  align: 'start',
  justify: 'start',
  margin: 3,
  shrink: 1,
})`
  padding-right: ${paddingHorizontal};
`;

const UniqueTokenExpandedStateHeader = ({ asset }) => {
  const handleActionSheetPress = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        Share.share({
          title: `Share ${buildUniqueTokenName(asset)} Info`,
          url: asset.permalink,
        });
      } else if (buttonIndex === 1) {
        // View on OpenSea
        Linking.openURL(asset.permalink);
      }
    },
    [asset]
  );

  return (
    <Container>
      <HeadingColumn>
        <RowWithMargins align="center" margin={3}>
          <Text
            color={colors.blueGreyDark50}
            letterSpacing="uppercase"
            size="smedium"
            uppercase
            weight="semibold"
          >
            {asset.asset_contract.name}
          </Text>
          <Pill maxWidth={150}>#{asset.id}</Pill>
        </RowWithMargins>
        <FlexItem flex={1}>
          <Text letterSpacing="roundedMedium" size="big" weight="bold">
            {buildUniqueTokenName(asset)}
          </Text>
        </FlexItem>
      </HeadingColumn>
      <ContextCircleButton
        flex={0}
        onPressActionSheet={handleActionSheetPress}
        options={contextButtonOptions}
      />
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateHeader, 'asset');
