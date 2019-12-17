import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { deviceUtils } from '../../utils';
import {
  ColumnWithMargins,
  Row,
  KeyboardFixedOpenLayout,
  RowWithMargins,
} from '../layout';
import { Emoji, Text } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';
import { AssetPanel } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const LabelText = withProps({ size: 'lmedium' })(Text);
const ValueText = withProps({ color: colors.alpha(colors.dark, 0.6) })(
  LabelText
);

const SwapDetailsState = () => {
  const { goBack } = useNavigation();

  return (
    <KeyboardFixedOpenLayout>
      <TouchableBackdrop onPress={goBack} />
      <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
        <AssetPanel>
          <ColumnWithMargins
            {...position.centeredAsObject}
            css={padding(24, 19)}
            margin={24}
          >
            <Row align="center" justify="space-between">
              <LabelText>1 DAI</LabelText>
              <ValueText>0.0019 MKR</ValueText>
            </Row>
            <Row align="center" justify="space-between">
              <LabelText>1 MKR</LabelText>
              <ValueText>511.3782 DAI</ValueText>
            </Row>
            <Row align="center" justify="space-between">
              <LabelText>DAI</LabelText>
              <ValueText>$1.00</ValueText>
            </Row>
            <Row align="center" justify="space-between">
              <LabelText>MKR</LabelText>
              <ValueText>$582.49</ValueText>
            </Row>
            <Row align="center" justify="space-between">
              <LabelText>Exchange</LabelText>
              <RowWithMargins align="center" margin={5}>
                <Emoji
                  lineHeight="none"
                  name="unicorn_face"
                  size="lmedium"
                  weight="medium"
                />
                <Text color="#DC6BE5" size="lmedium" weight="medium">
                  Uniswap
                </Text>
              </RowWithMargins>
            </Row>
          </ColumnWithMargins>
        </AssetPanel>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
};

export default SwapDetailsState;
