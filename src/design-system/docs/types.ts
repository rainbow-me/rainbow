import React from 'react';
import { Source } from './utils/source.macro';

export type Docs = {
  meta: Meta;
  description?: JSX.Element | JSX.Element[];
  examples?: (Example & {
    description?: JSX.Element | JSX.Element[];
    enablePlayroom?: boolean;
    enableCodeSnippet?: boolean;
    showFrame?: boolean;
  })[];
};

export type DocsExample = Example & {
  description?: JSX.Element | JSX.Element[];
  enablePlayroom?: boolean;
  enableCodeSnippet?: boolean;
  showFrame?: boolean;
};

export type Example = {
  name: string;
  Example?: () => Source<React.ReactChild>;
};

export type Meta = {
  name?: string;
  category: 'Color' | 'Content' | 'Layout' | 'Typography';
};

export type Playground = {
  meta: Meta;
  examples: Example[];
};
