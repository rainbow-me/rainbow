import { ReactNode } from 'react';

export type Docs = {
  name: string;
  examples: { name: string; example: ReactNode }[];
};
