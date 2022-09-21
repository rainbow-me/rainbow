import { palettes } from '../../color/palettes';

const tag = 'rgb(96, 165, 255)';
const attribute = palettes.dark.foregroundColors['secondary (Deprecated)'];
const value = 'rgb(144, 147, 255)';
const punctuation = 'rgb(96, 165, 255)';
const plainText = 'white';
const meta = 'rgb(96, 165, 255)';
const other = 'rgb(96, 165, 255)';
const inserted = 'rgb(96, 165, 255)';
const deleted = 'rgb(96, 165, 255)';

export default {
  'attr-name': {
    color: attribute,
  },
  'attr-value': {
    color: value,
  },
  'bold': {
    fontWeight: 'bold',
  },
  'boolean': {
    color: value,
  },
  'builtin': {
    color: other,
  },
  'cdata': {
    color: meta,
  },
  'char': {
    color: value,
  },
  'code[class*="language-"]': {
    color: plainText,
    whiteSpace: 'pre',
  },
  'comment': {
    color: meta,
  },
  'constant': {
    color: value,
  },
  'deleted-sign': {
    color: deleted,
  },
  'doctype': {
    color: meta,
  },
  'entity': {
    color: other,
    cursor: 'help',
  },
  'function': {
    color: tag,
  },
  'important': {
    color: other,
    fontWeight: 'bold',
  },
  'inserted-sign': {
    color: inserted,
  },
  'italic': {
    fontStyle: 'italic',
  },
  'keyword': {
    color: value,
  },
  'number': {
    color: value,
  },
  'operator': {
    color: other,
  },
  'pre[class*="language-"]': {
    margin: 0,
    whiteSpace: 'pre',
  },
  'prolog': {
    color: meta,
  },
  'property': {
    color: attribute,
  },
  'punctuation': {
    color: punctuation,
  },
  'regex': {
    color: other,
  },
  'selector': {
    color: value,
  },
  'string': {
    color: value,
  },
  'symbol': {
    color: value,
  },
  'tag': {
    color: tag,
  },
  'url': {
    color: other,
  },
};
