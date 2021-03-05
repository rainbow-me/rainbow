import { useContext } from 'react';

import AudioContext from '../context/AudioContext';

export default function useAudio() {
  return useContext(AudioContext);
}
