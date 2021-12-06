import BaseAlert from './BaseAlert';

const Prompt = (options: any) =>
  BaseAlert({
    ...options,
    alertType: 'prompt',
  });

export default Prompt;
