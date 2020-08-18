import React from 'react';
import { Column, FlexItem, Row } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
import { colors, padding } from '@rainbow-me/styles';

export default function WalletConnectExplainerItem({
  children,
  content,
  emoji,
  title,
}) {
  return (
    <Row align="start" css={padding(0, 36, 0, 0)}>
      <Emoji size="bmedium">{emoji}</Emoji>
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
}
