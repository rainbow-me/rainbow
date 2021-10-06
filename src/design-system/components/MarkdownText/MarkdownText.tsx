import React, {
  Children,
  createContext,
  Fragment,
  memo,
  ReactNode,
  useContext,
} from 'react';
import { Text as NativeText, StyleSheet, View } from 'react-native';
import MarkdownDisplay, {
  ASTNode,
  RenderRules,
} from 'react-native-markdown-display';
import { space } from '../../layout/space';
import { renderEmoji } from '../../typography/renderEmoji';
import { fonts } from '../../typography/typography';
import { Text } from '../Text/Text';
import { TextLink } from '../TextLink/TextLink';

const styles = StyleSheet.create({
  code: { ...fonts.SFMono.medium, letterSpacing: 0 },
  listItem: { flexDirection: 'row' },
  strong: fonts.SFProRounded.semibold,
  tableCell: { flex: 1 },
  tableRow: { flexDirection: 'row' },
  tabularNumbers: { fontVariant: ['tabular-nums'] },
});

const markdownStackSpace = {
  default: space['30'],
  nested: space['19'],
};

const markdownStackStyles = StyleSheet.create({
  item: { paddingBottom: markdownStackSpace.default },
  itemNested: { paddingBottom: markdownStackSpace.nested },
  root: { marginBottom: -markdownStackSpace.default },
  rootNested: { marginBottom: -markdownStackSpace.nested },
});

const StackDepthContext = createContext(0);

const MarkdownStack = ({ children }: { children: ReactNode }) => {
  const stackDepth = useContext(StackDepthContext) + 1;

  return (
    <StackDepthContext.Provider value={stackDepth}>
      <View
        style={
          stackDepth === 1
            ? markdownStackStyles.root
            : markdownStackStyles.rootNested
        }
      >
        {children}
      </View>
    </StackDepthContext.Provider>
  );
};

const MarkdownStackItem = ({ children }: { children: ReactNode }) => {
  const stackDepth = useContext(StackDepthContext);

  return (
    <View
      style={
        stackDepth === 1
          ? markdownStackStyles.item
          : markdownStackStyles.itemNested
      }
    >
      {children}
    </View>
  );
};

const renderBullet = (parents: ASTNode[], index: number): ReactNode => {
  const orderedListIndex = parents.findIndex(el => el.type === 'ordered_list');

  if (orderedListIndex > -1) {
    const orderedList = parents[orderedListIndex];
    const listItemNumber = orderedList.attributes?.start
      ? orderedList.attributes.start + index
      : index + 1;

    return (
      <NativeText style={styles.tabularNumbers}>{listItemNumber}.</NativeText>
    );
  }

  return `${ios ? '\u00B7' : '\u2022'}`;
};

const isNativeText = (child: ReactNode) =>
  typeof child === 'object' &&
  child !== null &&
  'type' in child &&
  child.type === NativeText;

const rules: RenderRules = {
  blockquote: ({ key }, children) => <Fragment key={key}>{children}</Fragment>,
  bullet_list: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <MarkdownStack>{children}</MarkdownStack>
    </MarkdownStackItem>
  ),
  code_block: ({ key, content }) => {
    // Trim trailing newlines
    const trimmedContent =
      typeof content === 'string' && content.charAt(content.length - 1) === '\n'
        ? content.substring(0, content.length - 1)
        : content;

    return (
      <MarkdownStackItem key={key}>
        <Text color="secondary50">
          <NativeText style={styles.code}>{trimmedContent}</NativeText>
        </Text>
      </MarkdownStackItem>
    );
  },
  code_inline: ({ key, content }) => (
    <NativeText key={key} style={styles.code}>
      {content}
    </NativeText>
  ),
  em: ({ key }, children) => (
    <NativeText key={key} style={styles.strong}>
      {children}
    </NativeText>
  ),
  fence: ({ key, content }) => {
    // Trim trailing newlines
    const trimmedContent =
      typeof content === 'string' && content.charAt(content.length - 1) === '\n'
        ? content.substring(0, content.length - 1)
        : content;

    return (
      <MarkdownStackItem key={key}>
        <Text color="secondary50">
          <NativeText style={styles.code}>{trimmedContent}</NativeText>
        </Text>
      </MarkdownStackItem>
    );
  },
  heading1: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text weight="heavy">{children}</Text>
    </MarkdownStackItem>
  ),
  heading2: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text weight="bold">{children}</Text>
    </MarkdownStackItem>
  ),
  heading3: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text weight="semibold">{children}</Text>
    </MarkdownStackItem>
  ),
  heading4: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text color="secondary70" weight="heavy">
        {children}
      </Text>
    </MarkdownStackItem>
  ),
  heading5: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text color="secondary70" weight="bold">
        {children}
      </Text>
    </MarkdownStackItem>
  ),
  heading6: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text color="secondary70" weight="semibold">
        {children}
      </Text>
    </MarkdownStackItem>
  ),
  hr: () => null, // Not currently supported
  link: ({ key, attributes }, children) => (
    <TextLink key={key} url={attributes.href}>
      {children}
    </TextLink>
  ),
  list_item: ({ key, index }, children, parents) => (
    <MarkdownStackItem key={key}>
      <View style={styles.listItem}>
        <Text color="secondary50">
          <NativeText accessible={false}>
            {renderBullet(parents, index)}{' '}
          </NativeText>
        </Text>
        <MarkdownStack>
          {Children.map(children, child =>
            isNativeText(child) ? (
              <MarkdownStackItem>
                <Text color="secondary50">{child}</Text>
              </MarkdownStackItem>
            ) : (
              child
            )
          )}
        </MarkdownStack>
      </View>
    </MarkdownStackItem>
  ),
  ordered_list: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <MarkdownStack>{children}</MarkdownStack>
    </MarkdownStackItem>
  ),
  paragraph: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <Text color="secondary50">{children}</Text>
    </MarkdownStackItem>
  ),
  strong: ({ key }, children) => (
    <NativeText key={key} style={styles.strong}>
      {children}
    </NativeText>
  ),
  table: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <MarkdownStack>{children}</MarkdownStack>
    </MarkdownStackItem>
  ),
  td: ({ key }, children) => (
    <View key={key} style={styles.tableCell}>
      <Text color="secondary50">{children}</Text>
    </View>
  ),
  text: ({ key, content }) => (
    <NativeText key={key}>{renderEmoji(content)}</NativeText>
  ),
  th: ({ key }, children) => (
    <View key={key} style={styles.tableCell}>
      <Text color="secondary70" weight="medium">
        {children}
      </Text>
    </View>
  ),
  tr: ({ key }, children) => (
    <MarkdownStackItem key={key}>
      <View style={styles.tableRow}>{children}</View>
    </MarkdownStackItem>
  ),
};

export interface MarkdownTextProps {
  children: string;
}

export const MarkdownText = memo(function MarkdownText({
  children,
}: MarkdownTextProps) {
  return (
    <MarkdownStack>
      <MarkdownDisplay rules={rules}>{children}</MarkdownDisplay>
    </MarkdownStack>
  );
});
