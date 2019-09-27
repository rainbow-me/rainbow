import BaseAlert from './BaseAlert';

const Prompt = options =>
  BaseAlert({
    ...options,
    alertType: 'prompt',
  });

export default Prompt;
