import React, { Fragment } from 'react';
import './fonts.css';
import './global.css';

import { ColorModeProvider } from '../../color/ColorMode';
import { Box } from '../../components/Box/Box';

export default ({ children, themeName }) => (
  <ColorModeProvider value={themeName}>
    <div id="root">
      <Box background="body">
        {children}
      </Box>
    </div>
  </ColorModeProvider>
);
