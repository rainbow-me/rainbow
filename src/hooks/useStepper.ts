import { useCallback, useState } from 'react';

export default function useStepper(max: number, initialIndex: number = 0) {
  const [step, setStep] = useState(initialIndex);
  const nextStep = useCallback(() => setStep(p => (p + 1) % max), [max]);
  return [step, nextStep, setStep];
}
