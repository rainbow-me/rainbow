import logger from 'logger';

const compareInputs = (oldInputs, newInputs, prefix) => {
  // Edge-case: different array lengths
  if (oldInputs.length !== newInputs.length) {
    // Not helpful to compare item by item, so just output the whole array
    logger.log(
      `${prefix} - Inputs have a different length`,
      oldInputs,
      newInputs
    );
    logger.log('Old inputs:', oldInputs);
    logger.log('New inputs:', newInputs);
    return;
  }

  // Compare individual items
  oldInputs.forEach((oldInput, index) => {
    const newInput = newInputs[index];
    if (oldInput !== newInput) {
      logger.log(`${prefix} - The input changed in position ${index}`);
      logger.log('Old value:', oldInput);
      logger.log('New value:', newInput);
    }
  });
};

export const useEffectDebugger = (func, inputs, prefix = 'useEffect') => {
  // Using a ref to hold the inputs from the previous run (or same run for initial run
  const oldInputsRef = useRef(inputs);
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
