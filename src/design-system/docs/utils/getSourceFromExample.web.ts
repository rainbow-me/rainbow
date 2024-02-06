import typescript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { Example } from '../types';

function prettify(code: string) {
  return prettier
    .format(code, {
      parser: 'typescript',
      plugins: [typescript],
      printWidth: 60,
      semi: false,
    })
    .replace(/^;/, '')
    .replace(/\n$/, '');
}

export const getSourceFromExample = ({ Example }: { Example: Example['Example'] }) => {
  let isIffe = false;
  let jsxString = '';
  let element;

  if (Example) {
    const result = Example();
    isIffe = /^\(\(\) => \{/.test(result.code);
    element = result.value;
    jsxString = result.code
      .replace(/id={id}/g, '')
      .replace(/^\(\(\) => \{/, '')
      .replace(/\}\)\(\)$/, '');
  }

  const code = prettify(jsxString);
  const displayCode = isIffe ? prettify(`function Example() {${code}}`) : code;
  const playroomCode = isIffe ? `{(${displayCode})()}` : code;

  return {
    code,
    displayCode,
    element,
    playroomCode,
  };
};
