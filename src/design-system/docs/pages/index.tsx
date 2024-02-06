import uniqBy from 'lodash/uniqBy';
import type { NextPage } from 'next';
import React from 'react';

import { DocsAccordion } from '../components/DocsAccordion';
import * as docs from '../docs';
import { Blockquote, Code, Heading, Stack, Text } from '../system';
import { sprinkles } from '../system/sprinkles.css';
import { Docs } from '../types';

const categoryOrder: [string, string[]][] = [
  ['Layout', ['Introduction', 'Box']],
  ['Typography', ['Introduction', 'Font weights', 'Font sizes']],
  ['Color', ['Introduction', 'Colors']],
];

const Home: NextPage = () => {
  const docsByCategory = Object.values(docs).reduce((currentCategories: { [key: string]: Docs[] }, { default: doc }) => {
    return {
      ...currentCategories,
      [doc.meta.category]: [...(currentCategories[doc.meta.category] || []), doc],
    };
  }, {});
  const orderedDocsByCategory: [string, Docs[]][] = categoryOrder.map(order => {
    const [category, subCategoryNames] = order;
    const subCategories = uniqBy(
      [
        ...subCategoryNames.map(
          subCategoryName => docsByCategory[category].find(subCategory => subCategory.meta.name === subCategoryName) as Docs
        ),
        ...docsByCategory[category],
      ],
      'meta.name'
    );
    return [category, subCategories];
  });

  return (
    <div
      className={sprinkles({
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '768px',
        paddingBottom: '48px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '48px',
      })}
    >
      <Stack space="40px">
        <Heading size="32px" weight="heavy">
          🌈🎨 Rainbow Design System Cheat Sheet 🎨🌈
        </Heading>
        <Text>
          The goal of Rainbow Design System is to make it fast and easy to build and maintain standard Rainbow designs. As much as possible,
          component APIs at the screen level should be high level, reading the way a designer would describe them.
        </Text>
        <Text>
          You ideally shouldn&apos;t have to write a bunch of low-level styling or manually adjust padding and margins on individual
          components to create visual balance. To achieve this, we need to start at the foundations and build up in layers.
        </Text>
        <Blockquote>
          <Stack space="32px">
            <Text>
              This cheat sheet is not currently intended to be exhaustive, instead providing an overview of the core parts of the system.
              This is still a work in progress. APIs are incomplete and likely to change.
            </Text>
            <Text>
              It&apos;s recommended that all code importing from <Code>@/design-system</Code> is written in TypeScript so that API changes
              are picked up.
            </Text>
          </Stack>
        </Blockquote>
        {orderedDocsByCategory.map(([categoryName, subCategories], i) => (
          <Stack key={i} space="16px">
            <Heading weight="heavy">{categoryName}</Heading>
            <div>
              {subCategories.map((docs, i) => {
                return <DocsAccordion key={i} {...docs} />;
              })}
            </div>
          </Stack>
        ))}
      </Stack>
    </div>
  );
};

export default Home;
