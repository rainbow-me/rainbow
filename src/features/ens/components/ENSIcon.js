import * as React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const ENSIcon = props => (
  <Svg height="80" viewBox="0 0 70 80" width="70" {...props}>
    <Defs>
      <LinearGradient gradientUnits="userSpaceOnUse" id="linear-gradient" x1={41.95} x2={12.57} y1={2.57} y2={34.42}>
        <Stop offset={0.58} stopColor="#a0a8d4" />
        <Stop offset={0.73} stopColor="#8791c7" />
        <Stop offset={0.91} stopColor="#6470b4" />
      </LinearGradient>
      <LinearGradient id="linear-gradient-2" x1={42.57} x2={71.96} xlinkHref="#linear-gradient" y1={81.66} y2={49.81} />
      <LinearGradient gradientUnits="userSpaceOnUse" id="linear-gradient-3" x1={42.26} x2={42.26} y1={1.24} y2={82.84}>
        <Stop offset={0} stopColor="#9994fc" />
        <Stop offset={0.18} stopColor="#93a6ff" />
        <Stop offset={0.57} stopColor="#5298ff" />
        <Stop offset={1} stopColor="#52e5ff" />
      </LinearGradient>
    </Defs>
    <G
      style={{
        isolation: 'isolate',
      }}
    >
      <G>
        <Path
          d="M15.28 34.39c.8 1.71 2.78 5.09 2.78 5.09L40.95 1.64l-22.34 15.6a9.75 9.75 0 0 0-3.18 3.5 16.19 16.19 0 0 0-.15 13.65z"
          fill="url(#linear-gradient)"
          transform="translate(-6 -1.64)"
        />
        <Path
          d="M6.21 46.85a25.47 25.47 0 0 0 10 18.51l24.71 17.23s-15.46-22.28-28.5-44.45a22.39 22.39 0 0 1-2.62-7.56 12.1 12.1 0 0 1 0-3.63c-.34.63-1 1.92-1 1.92a29.35 29.35 0 0 0-2.67 8.55 52.28 52.28 0 0 0 .08 9.43z"
          fill="#a0a8d4"
          transform="translate(-6 -1.64)"
        />
        <Path
          d="M69.25 49.84c-.8-1.71-2.78-5.09-2.78-5.09L43.58 82.59 65.92 67a9.75 9.75 0 0 0 3.18-3.5 16.19 16.19 0 0 0 .15-13.66z"
          fill="url(#linear-gradient-2)"
          transform="translate(-6 -1.64)"
        />
        <Path
          d="M78.32 37.38a25.47 25.47 0 0 0-10-18.51L43.61 1.64s15.45 22.28 28.5 44.45a22.39 22.39 0 0 1 2.61 7.56 12.1 12.1 0 0 1 0 3.63c.34-.63 1-1.92 1-1.92a29.35 29.35 0 0 0 2.67-8.55 52.28 52.28 0 0 0-.07-9.43z"
          fill="#a0a8d4"
          transform="translate(-6 -1.64)"
        />
        <Path
          d="M15.43 20.74a9.75 9.75 0 0 1 3.18-3.5l22.34-15.6-22.89 37.85s-2-3.38-2.78-5.09a16.19 16.19 0 0 1 .15-13.66zM6.21 46.85a25.47 25.47 0 0 0 10 18.51l24.71 17.23s-15.46-22.28-28.5-44.45a22.39 22.39 0 0 1-2.62-7.56 12.1 12.1 0 0 1 0-3.63c-.34.63-1 1.92-1 1.92a29.35 29.35 0 0 0-2.67 8.55 52.28 52.28 0 0 0 .08 9.43zm63 3c-.8-1.71-2.78-5.09-2.78-5.09L43.58 82.59 65.92 67a9.75 9.75 0 0 0 3.18-3.5 16.19 16.19 0 0 0 .15-13.66zm9.07-12.46a25.47 25.47 0 0 0-10-18.51L43.61 1.64s15.45 22.28 28.5 44.45a22.39 22.39 0 0 1 2.61 7.56 12.1 12.1 0 0 1 0 3.63c.34-.63 1-1.92 1-1.92a29.35 29.35 0 0 0 2.67-8.55 52.28 52.28 0 0 0-.07-9.43z"
          fill="url(#linear-gradient-3)"
          style={{
            mixBlendMode: 'color',
          }}
          transform="translate(-6 -1.64)"
        />
      </G>
    </G>
  </Svg>
);

export default ENSIcon;
