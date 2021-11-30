export type Docs = {
  name: string;
  category: 'Content' | 'Layout';
  examples: { name: string; Example: () => JSX.Element }[];
};
