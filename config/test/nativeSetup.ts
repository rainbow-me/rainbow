import './setup';

import { vi } from 'vitest';

vi.mock('@react-navigation/native', () => vi.importActual('@react-navigation/core'));
