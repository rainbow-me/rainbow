import { DocsExample } from '../types';

export const getSourceFromExample = ({
  Example,
}: {
  Example: DocsExample['Example'];
}) => {
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
