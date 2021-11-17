import { ReactNode } from 'react';

export type Docs = {
  name: string;
  category: 'Content' | 'Layout';
  examples: ({ name: string } & (
    | { example: ReactNode }
    | { Example: () => JSX.Element }
  ))[];
};
