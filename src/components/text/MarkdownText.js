import React from 'react';
import Markdown from 'react-native-markdown-display';
import Text from './Text';

const MarkdownText = ({ children, ...props }) => {
  const MarkdownBody = (node, markdownChildren, _parent, styles) => (
    <Text key={node.key} style={{ ...styles, marginBottom: 36 }} {...props}>
      {markdownChildren}
    </Text>
  );

  return (
    <Markdown
      rules={{
        paragraph: MarkdownBody,
      }}
    >
      {children}
    </Markdown>
  );
};

MarkdownText.propTypes = {};

export default MarkdownText;
