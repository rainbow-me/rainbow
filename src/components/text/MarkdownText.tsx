import React from 'react';
import Markdown from 'react-native-markdown-display';
import styled from 'styled-components';
import Text from './Text';

const Paragraph = styled(Text)`
  margin-bottom: 19;
`;

export default function MarkdownText({ children, ...props }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const renderParagraph = useCallback(
    ({ key }: any, markdownChildren: any, _: any, styles: any) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Paragraph {...props} key={key} style={styles}>
        {markdownChildren}
      </Paragraph>
    ),
    [props]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const rules = useMemo(
    () => ({
      paragraph: renderParagraph,
    }),
    [renderParagraph]
  );

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Markdown rules={rules}>{children}</Markdown>;
}
