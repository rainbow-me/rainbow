import { expect, test } from '@jest/globals';

import { Analytics } from '@/analytics';

describe('@/analytics', () => {
  test('track', () => {
    const analytics = new Analytics({});
    analytics.track(analytics.events.generics.pressedButton);
  });
});
