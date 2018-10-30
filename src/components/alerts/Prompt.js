import BaseAlert from './BaseAlert';

const Prompt = (options) => BaseAlert({
  ...options,
  type: 'prompt',
});

export default Prompt;
