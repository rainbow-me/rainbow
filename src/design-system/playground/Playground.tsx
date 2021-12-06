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
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/BackgroundProvider/Backgroun... Remove this comment to see the full error message
import backgroundDocs from '../components/BackgroundProvider/BackgroundProvider.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Bleed/Bleed.docs' was resolv... Remove this comment to see the full error message
import bleedDocs from '../components/Bleed/Bleed.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Box/Box.docs' was resolved t... Remove this comment to see the full error message
import boxDocs from '../components/Box/Box.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Columns/Columns.docs' was re... Remove this comment to see the full error message
import columnsDocs from '../components/Columns/Columns.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Heading/Heading.docs' was re... Remove this comment to see the full error message
import headingDocs from '../components/Heading/Heading.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Inline/Inline.docs' was reso... Remove this comment to see the full error message
import inlineDocs from '../components/Inline/Inline.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Inset/Inset.docs' was resolv... Remove this comment to see the full error message
import insetDocs from '../components/Inset/Inset.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/MarkdownText/MarkdownText.do... Remove this comment to see the full error message
import markdownTextDocs from '../components/MarkdownText/MarkdownText.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Row/Row.docs' was resolved t... Remove this comment to see the full error message
import rowDocs from '../components/Row/Row.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Stack/Stack.docs' was resolv... Remove this comment to see the full error message
import stackDocs from '../components/Stack/Stack.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Text/Text.docs' was resolved... Remove this comment to see the full error message
import textDocs from '../components/Text/Text.docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TextLink/TextLink.docs' was ... Remove this comment to see the full error message
import textLinkDocs from '../components/TextLink/TextLink.docs';
import { Docs } from './Docs';

const allDocs = [
  backgroundDocs,
  bleedDocs,
  boxDocs,
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack space="30px">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableOpacity
        onPress={useCallback(() => setOpen(x => !x), [setOpen])}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Inline space="6px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View style={styles.docsRowToggle}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Heading size="20px">{open ? '-' : '+'}</Heading>
          </View>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Heading size="20px">{name}</Heading>
        </Inline>
      </TouchableOpacity>
      {open
        ? examples.map(({ name, Example }, index) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Stack key={index} space="12px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Heading size="18px" weight="bold">
                {name}
              </Heading>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <View
                style={
                  category === 'Layout' && name !== 'Box'
                    ? styles.layoutContainer
                    : undefined
                }
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Example />
              </View>
            </Stack>
          ))
        : null}
    </Stack>
  );
};

export const Playground = () => {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(hideSplashScreen, [hideSplashScreen]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android ? <View style={{ height: StatusBar.currentHeight }} /> : null}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Inset space="19px">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Stack space="24px">
          {allDocs.map(({ name, category, examples }, index) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
