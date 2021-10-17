import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHideSplashScreen } from '../../hooks';
import { Heading, Inline, Inset, Stack } from '../';
import bleedDocs from '../components/Bleed/Bleed.docs';
import columnsDocs from '../components/Columns/Columns.docs';
import headingDocs from '../components/Heading/Heading.docs';
import inlineDocs from '../components/Inline/Inline.docs';
import insetDocs from '../components/Inset/Inset.docs';
import markdownTextDocs from '../components/MarkdownText/MarkdownText.docs';
import rowDocs from '../components/Row/Row.docs';
import stackDocs from '../components/Stack/Stack.docs';
import textDocs from '../components/Text/Text.docs';
import textLinkDocs from '../components/TextLink/TextLink.docs';
import { Docs } from './Docs';

const allDocs = [
  bleedDocs,
  columnsDocs,
  headingDocs,
  inlineDocs,
  insetDocs,
  markdownTextDocs,
  rowDocs,
  stackDocs,
  textDocs,
  textLinkDocs,
];

const styles = StyleSheet.create({
  docsRowToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 14,
  },
  layoutContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

const DocsRow = ({ name, category, examples }: Docs) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack space="30dp">
      <TouchableOpacity
        onPress={useCallback(() => setOpen(x => !x), [setOpen])}
      >
        <Inline space="6dp">
          <View style={styles.docsRowToggle}>
            <Heading size="title">{open ? '-' : '+'}</Heading>
          </View>
          <Heading size="title">{name}</Heading>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples.map((example, index) => (
            <Stack key={index} space="30dp">
              <Heading weight="bold">{example.name}</Heading>
              <View
                style={
                  category === 'Layout' ? styles.layoutContainer : undefined
                }
              >
                {example.example}
              </View>
            </Stack>
          ))
        : null}
    </Stack>
  );
};

export const Playground = () => {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(() => hideSplashScreen(), [hideSplashScreen]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {android ? <View style={{ height: StatusBar.currentHeight }} /> : null}
      <Inset space="19dp">
        <Stack space="30dp">
          {allDocs.map(({ name, category, examples }, index) => (
            <DocsRow
              category={category}
              examples={examples}
              key={index}
              name={name}
            />
          ))}
        </Stack>
      </Inset>
    </ScrollView>
  );
};
