import React, { Children, createContext, Fragment, memo, ReactNode, useContext, useMemo } from 'react';
import { Text as NativeText, Platform, StyleSheet, View } from 'react-native';
import MarkdownDisplay, { ASTNode, RenderRules } from 'react-native-markdown-display';
import { negateSpace, Space } from '../../layout/space';
import { renderStringWithEmoji } from '../../typography/renderStringWithEmoji';
import { fonts } from '../../typography/typography';
import { Box } from '../Box/Box';
import { Text, TextProps } from '../Text/Text';
import { TextLink } from '../TextLink/TextLink';

const styles = StyleSheet.create({
  code: { ...fonts.SFMono.medium, letterSpacing: 0 },
  strong: fonts.SFProRounded.semibold,
  tableCell: { flex: 1 },
  tabularNumbers: { fontVariant: ['tabular-nums'] },
});

const defaultProps: {
  listSpace: Space;
  paragraphSpace: Space;
  size: NonNullable<TextProps['size']>;
} = {
  listSpace: '19px (Deprecated)',
  paragraphSpace: '30px (Deprecated)',
  size: '16px / 22px (Deprecated)',
};

interface MarkdownStackContextObject {
  paragraphSpace: Space;
  listSpace: Space;
  depth: number;
}
const MarkdownStackContext = createContext<MarkdownStackContextObject>({
  depth: 0,
  listSpace: defaultProps.listSpace,
  paragraphSpace: defaultProps.paragraphSpace,
});

interface MarkdownStackProps {
  paragraphSpace?: Space;
  listSpace?: Space;
  children: ReactNode;
}

function MarkdownStack({ paragraphSpace = defaultProps.paragraphSpace, listSpace = defaultProps.listSpace, children }: MarkdownStackProps) {
  const depth = useContext(MarkdownStackContext).depth + 1;

  return (
    <MarkdownStackContext.Provider value={useMemo(() => ({ depth, listSpace, paragraphSpace }), [depth, paragraphSpace, listSpace])}>
      <Box marginBottom={negateSpace(depth === 1 ? paragraphSpace : listSpace)}>{children}</Box>
    </MarkdownStackContext.Provider>
  );
}

interface MarkdownStackItemProps {
  children: ReactNode;
}

function MarkdownStackItem({ children }: MarkdownStackItemProps) {
  const { depth, paragraphSpace, listSpace } = useContext(MarkdownStackContext);

  return <Box paddingBottom={depth === 1 ? paragraphSpace : listSpace}>{children}</Box>;
}

function renderBullet(parents: ASTNode[], index: number): ReactNode {
  const orderedListIndex = parents.findIndex(el => el.type === 'ordered_list');

  if (orderedListIndex > -1) {
    const orderedList = parents[orderedListIndex];
    const listItemNumber = orderedList.attributes?.start ? orderedList.attributes.start + index : index + 1;

    return <NativeText style={styles.tabularNumbers}>{listItemNumber}.</NativeText>;
  }

  return `${Platform.OS === 'ios' ? '\u00B7' : '\u2022'}`;
}

function isNativeText(child: ReactNode) {
  return typeof child === 'object' && child !== null && 'type' in child && child.type === NativeText;
}

export type MarkdownTextProps = {
  children: string;
  size?: TextProps['size'];
  color: TextProps['color'];
  heading1Color?: TextProps['color'];
  heading2Color?: TextProps['color'];
  paragraphSpace: Space;
  listSpace: Space;
  handleLinkPress?: (url: string) => void;
};

/**
 * @description Renders a markdown string as a series of Text components. The
 * text size and spacing between lines can be customized.
 */
export const MarkdownText = memo(function MarkdownText({
  children,
  color,
  handleLinkPress,
  heading1Color: heading1ColorProp,
  heading2Color: heading2ColorProp,
  listSpace = defaultProps.listSpace,
  paragraphSpace = defaultProps.paragraphSpace,
  size = defaultProps.size,
}: MarkdownTextProps) {
  const heading1Color = heading1ColorProp ?? color;
  const heading2Color = heading2ColorProp ?? heading1ColorProp ?? color;

  const spaceProps = useMemo(() => ({ listSpace, paragraphSpace }), [paragraphSpace, listSpace]);

  const rules: RenderRules = useMemo(() => {
    return {
      blockquote: ({ key }, children) => <Fragment key={key}>{children}</Fragment>,
      bullet_list: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      code_block: ({ key, content }) => {
        // Trim trailing newlines
        const trimmedContent =
          typeof content === 'string' && content.charAt(content.length - 1) === '\n' ? content.substring(0, content.length - 1) : content;

        return (
          <MarkdownStackItem key={key}>
            <Text color={color} size={size}>
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
          typeof content === 'string' && content.charAt(content.length - 1) === '\n' ? content.substring(0, content.length - 1) : content;

        return (
          <MarkdownStackItem key={key}>
            <Text color={color} size={size}>
              <NativeText style={styles.code}>{trimmedContent}</NativeText>
            </Text>
          </MarkdownStackItem>
        );
      },
      heading1: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading1Color} size={size} weight="heavy">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading2: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading1Color} size={size} weight="bold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading3: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading1Color} size={size} weight="semibold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading4: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading2Color} size={size} weight="heavy">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading5: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading2Color} size={size} weight="bold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      heading6: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={heading2Color} size={size} weight="semibold">
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      hr: () => null, // Not currently supported
      link: ({ key, attributes }, children) => (
        <TextLink handleLinkPress={handleLinkPress} key={key} url={attributes.href}>
          {children}
        </TextLink>
      ),
      list_item: ({ key, index }, children, parents) => (
        <MarkdownStackItem key={key}>
          <Box flexDirection="row">
            <Text color={color} size={size}>
              <NativeText accessible={false}>{renderBullet(parents, index)} </NativeText>
            </Text>
            <MarkdownStack {...spaceProps}>
              {Children.map(children, child =>
                isNativeText(child) ? (
                  <MarkdownStackItem>
                    <Text color={color} size={size}>
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
        <MarkdownStackItem key={key}>
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      paragraph: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Text color={color} size={size}>
            {children}
          </Text>
        </MarkdownStackItem>
      ),
      strong: ({ key }, children) => (
        <NativeText key={key} style={styles.strong}>
          {children}
        </NativeText>
      ),
      table: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <MarkdownStack {...spaceProps}>{children}</MarkdownStack>
        </MarkdownStackItem>
      ),
      td: ({ key }, children) => (
        <View key={key} style={styles.tableCell}>
          <Text color={color} size={size}>
            {children}
          </Text>
        </View>
      ),
      text: ({ key, content }) => <NativeText key={key}>{renderStringWithEmoji(content)}</NativeText>,
      th: ({ key }, children) => (
        <View key={key} style={styles.tableCell}>
          <Text color={color} size={size} weight="medium">
            {children}
          </Text>
        </View>
      ),
      tr: ({ key }, children) => (
        <MarkdownStackItem key={key}>
          <Box flexDirection="row">{children}</Box>
        </MarkdownStackItem>
      ),
    };
  }, [spaceProps, size, color, handleLinkPress, heading1Color, heading2Color]);

  return (
    <MarkdownStack {...spaceProps}>
      {/* @ts-expect-error MarkdownDisplay component library is unmaintained and isn't updated to work well with React 18 */}
      <MarkdownDisplay rules={rules}>{children}</MarkdownDisplay>
    </MarkdownStack>
  );
});
