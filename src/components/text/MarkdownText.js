import React from 'react';
import Markdown from 'react-native-markdown-display';
import Text from './Text';
import styled from '@/styled-thing';

const Paragraph = styled(Text)({
  marginBottom: 19,
});

export default function MarkdownText({ children, ...props }) {
  const renderParagraph = useCallback(
    ({ key }, markdownChildren, _, styles) => (
      <Paragraph {...props} key={key} style={styles}>
        {markdownChildren}
      </Paragraph>
    ),
    [props]
  );

  const rules = useMemo(
    () => ({
      paragraph: renderParagraph,
    }),
    [renderParagraph]
  );

  return <Markdown rules={rules}>{children}</Markdown>;
}
