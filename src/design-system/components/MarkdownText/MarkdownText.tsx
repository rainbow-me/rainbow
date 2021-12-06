import React, {
  Children,
  createContext,
  Fragment,
  memo,
  ReactNode,
  useContext,
  useMemo,
} from 'react';
import { Text as NativeText, Platform, StyleSheet, View } from 'react-native';
import MarkdownDisplay, {
  ASTNode,
  RenderRules,
} from 'react-native-markdown-display';
import { negateSpace, Space } from '../../layout/space';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../typography/renderStringWithEmoji' wa... Remove this comment to see the full error message
import { renderStringWithEmoji } from '../../typography/renderStringWithEmoji';
import { fonts } from '../../typography/typography';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Box/Box' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { Box } from '../Box/Box';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Text/Text' was resolved to '/Users/nick... Remove this comment to see the full error message
import { Text, TextProps } from '../Text/Text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TextLink/TextLink' was resolved to '/Us... Remove this comment to see the full error message
import { TextLink } from '../TextLink/TextLink';

const styles = StyleSheet.create({
  code: { ...fonts.SFMono.medium, letterSpacing: 0 },
  strong: fonts.SFProRounded.semibold,
  tableCell: { flex: 1 },
  tabularNumbers: { fontVariant: ['tabular-nums'] },
});

const defaultProps: {
  nestedSpace: Space;
  space: Space;
  size: NonNullable<TextProps['size']>;
} = {
  nestedSpace: '19px',
  size: '16px',
  space: '30px',
};

interface MarkdownStackContextObject {
  space: Space;
  nestedSpace: Space;
  depth: number;
}
const MarkdownStackContext = createContext<MarkdownStackContextObject>({
  depth: 0,
  nestedSpace: defaultProps.nestedSpace,
  space: defaultProps.space,
});

interface MarkdownStackProps {
  space?: Space;
  nestedSpace?: Space;
  children: ReactNode;
}

function MarkdownStack({
  space = defaultProps.space,
  nestedSpace = defaultProps.nestedSpace,
  children,
}: MarkdownStackProps) {
  const depth = useContext(MarkdownStackContext).depth + 1;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <MarkdownStackContext.Provider
      value={useMemo(() => ({ depth, nestedSpace, space }), [
        depth,
        space,
        nestedSpace,
      ])}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Box marginBottom={negateSpace(depth === 1 ? space : nestedSpace)}>
        {children}
      </Box>
    </MarkdownStackContext.Provider>
  );
}

interface MarkdownStackItemProps {
  children: ReactNode;
}

function MarkdownStackItem({ children }: MarkdownStackItemProps) {
  const { depth, space, nestedSpace } = useContext(MarkdownStackContext);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Box paddingBottom={depth === 1 ? space : nestedSpace}>{children}</Box>
  );
}

function renderBullet(parents: ASTNode[], index: number): ReactNode {
  const orderedListIndex = parents.findIndex(el => el.type === 'ordered_list');

  if (orderedListIndex > -1) {
    const orderedList = parents[orderedListIndex];
    const listItemNumber = orderedList.attributes?.start
      ? orderedList.attributes.start + index
      : index + 1;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <NativeText style={styles.tabularNumbers}>{listItemNumber}.</NativeText>
    );
  }

  return `${Platform.OS === 'ios' ? '\u00B7' : '\u2022'}`;
}

function isNativeText(child: ReactNode) {
  return (
    typeof child === 'object' &&
    child !== null &&
    'type' in child &&
    child.type === NativeText
  );
}

export type MarkdownTextProps = {
  children: string;
  size?: TextProps['size'];
} & (
  | { space?: never; nestedSpace?: never }
  | { space: Space; nestedSpace: Space }
);

/**
 * @description Renders a markdown string as a series of Text components. The
 * text size and spacing between lines can be customized.
 */
export const MarkdownText = memo(function MarkdownText({
  children,
  space = defaultProps.space,
  nestedSpace = defaultProps.nestedSpace,
  size = defaultProps.size,
}: MarkdownTextProps) {
  const spaceProps = useMemo(() => ({ nestedSpace, space }), [
    space,
    nestedSpace,
  ]);

  const rules: RenderRules = useMemo(() => {
    return {
      blockquote: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment key={key}>{children}</Fragment>
      ),
      bullet_list: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      code_block: ({ key, content }) => {
        // Trim trailing newlines
        const trimmedContent =
          typeof content === 'string' &&
          content.charAt(content.length - 1) === '\n'
            ? content.substring(0, content.length - 1)
            : content;

        return (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MarkdownStackItem key={key}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color="secondary50" size={size}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NativeText style={styles.code}>{trimmedContent}</NativeText>
            </Text>
          </MarkdownStackItem>
        );
      },
      code_inline: ({ key, content }) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <NativeText key={key} style={styles.code}>
          {content}
        </NativeText>
      ),
      em: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <NativeText key={key} style={styles.strong}>
          {children}
        </NativeText>
      ),
      fence: ({ key, content }) => {
        // Trim trailing newlines
        const trimmedContent =
          typeof content === 'string' &&
          content.charAt(content.length - 1) === '\n'
            ? content.substring(0, content.length - 1)
            : content;

        return (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MarkdownStackItem key={key}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color="secondary50" size={size}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NativeText style={styles.code}>{trimmedContent}</NativeText>
            </Text>
          </MarkdownStackItem>
        );
      },
      heading1: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size={size} weight="heavy">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading2: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size={size} weight="bold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading3: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size={size} weight="semibold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading4: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary70" size={size} weight="heavy">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading5: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary70" size={size} weight="bold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading6: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary70" size={size} weight="semibold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      hr: () => null, // Not currently supported
      link: ({ key, attributes }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TextLink key={key} url={attributes.href}>
          {children}
        </TextLink>
      ),
      list_item: ({ key, index }, children, parents) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Box flexDirection="row">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color="secondary50" size={size}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NativeText accessible={false}>
                {renderBullet(parents, index)}{' '}
              </NativeText>
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <MarkdownStack {...spaceProps}>
              {Children.map(children, child =>
                isNativeText(child) ? (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <MarkdownStackItem>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50" size={size}>
                      {child}
                    </Text>
                  </MarkdownStackItem>
                ) : (
                  child
                )
              )}
            </MarkdownStack>
          </Box>
        </MarkdownStackItem>
      ),
      ordered_list: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      paragraph: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary50" size={size}>
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      strong: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <NativeText key={key} style={styles.strong}>
          {children}
        </NativeText>
      ),
      table: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      td: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View key={key} style={styles.tableCell}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary50" size={size}>
            {children}
          </Text>
        </View>
      ),
      text: ({ key, content }) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <NativeText key={key}>{renderStringWithEmoji(content)}</NativeText>
      ),
      th: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View key={key} style={styles.tableCell}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary70" size={size} weight="medium">
            {children}
          </Text>
        </View>
      ),
      tr: ({ key }, children) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MarkdownStackItem key={key}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Box flexDirection="row">{children}</Box>
        </MarkdownStackItem>
      ),
    };
  }, [spaceProps, size]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <MarkdownStack {...spaceProps}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <MarkdownDisplay rules={rules}>{children}</MarkdownDisplay>
    </MarkdownStack>
  );
});
