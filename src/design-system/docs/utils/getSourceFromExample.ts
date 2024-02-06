import { Example } from '../types';

export const getSourceFromExample = ({ Example }: { Example: Example['Example'] }) => {
  let element;

  if (Example) {
    element = Example();
  }

  return {
    code: '',
    displayCode: '',
    element,
    playroomCode: '',
  };
};
