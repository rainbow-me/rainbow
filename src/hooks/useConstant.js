import { useRef } from 'react';

export default function useConstant(fn) {
  const ref = useRef();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
}
