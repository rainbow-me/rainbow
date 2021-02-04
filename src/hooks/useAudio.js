import * as React from 'react';

import AudioContext from '../context/AudioContext';

export default function useAudio() {
  return React.useContext(AudioContext);
}
