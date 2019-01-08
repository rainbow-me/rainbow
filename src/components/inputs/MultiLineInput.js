import { compose, setDisplayName, withProps } from 'recompact';
import Input from './Input';

export default compose(
  setDisplayName('MultiLineInput'),
  withProps({
    lineHeight: 'loosest',
    multiline: true,
  }),
)(Input);
