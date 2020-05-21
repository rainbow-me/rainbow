import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { colors, padding } from '../../styles';
import { Column, FlexItem, Row } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';

const WalletConnectExplainerItem = ({ children, content, emoji, title }) => (
  <Row align="start" css={padding(0, 36, 0, 0)}>
    <Emoji name={emoji} size="bmedium" />
    <Column flex={1} paddingLeft={8}>
      <FlexItem>
        <TruncatedText lineHeight="normal" size="bmedium" weight="semibold">
          {title}
        </TruncatedText>
      </FlexItem>
      <FlexItem marginTop={4}>
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.45)}
          lineHeight="loose"
          size="smedium"
        >
          {content}
        </Text>
      </FlexItem>
      {children && <FlexItem marginTop={8}>{children}</FlexItem>}
    </Column>
  </Row>
);

WalletConnectExplainerItem.propTypes = {
  children: PropTypes.node,
  content: PropTypes.string,
  emoji: PropTypes.string,
  title: PropTypes.string,
};

export default pure(WalletConnectExplainerItem);
