import { logger } from '@/logger';

const compareInputs = (oldInputs: any, newInputs: any, prefix: any) => {
  // Edge-case: different array lengths
  if (oldInputs.length !== newInputs.length) {
    // Not helpful to compare item by item, so just output the whole array
    logger.debug(`[useEffectDebugger]: ${prefix} - Inputs have a different length`, oldInputs, newInputs);
    logger.debug(`[useEffectDebugger]: Old inputs:`, oldInputs);
    logger.debug(`[useEffectDebugger]: New inputs:`, newInputs);
    return;
  }

  // Compare individual items
  oldInputs.forEach((oldInput: any, index: any) => {
    const newInput = newInputs[index];
    if (oldInput !== newInput) {
      logger.debug(`[useEffectDebugger]: ${prefix} - The input changed in position ${index}`);
      logger.debug(`[useEffectDebugger]: Old value:`, oldInput);
      logger.debug(`[useEffectDebugger]: New value:`, newInput);
    }
  });
};

const useEffectDebugger = (func: any, inputs: any, prefix = 'useEffect') => {
  // Using a ref to hold the inputs from the previous run (or same run for initial run
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useRef'.
  const oldInputsRef = useRef(inputs);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useEffect'.
  useEffect(() => {
    // Get the old inputs
    const oldInputs = oldInputsRef.current;

    // Compare the old inputs to the current inputs
    compareInputs(oldInputs, inputs, prefix);

    // Save the current inputs
    oldInputsRef.current = inputs;

    // Execute wrapped effect
    func();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs);
};

export default useEffectDebugger;
