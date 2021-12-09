import React from 'react';
import { Source } from './utils/source.macro';

export type Docs = {
  name?: string;
  category: 'Color' | 'Content' | 'Layout' | 'Typography';
  description?: JSX.Element | JSX.Element[];
  examples?: DocsExample[];
};

export type DocsExample = {
  name: string;
  description?: JSX.Element | JSX.Element[];
  Example?: () => Source<React.ReactChild>;
  enablePlayroom?: boolean;
  enableCodeSnippet?: boolean;
  showFrame?: boolean;
};
