import { type RefObject } from 'react';

import type WebView from 'react-native-webview';

import { appMessenger } from './AppMessenger';

test('routes a WebView reply to the matching app message', async () => {
  const injectJavaScript = jest.fn();
  const messenger = appMessenger({ current: { injectJavaScript } } as unknown as RefObject<WebView>, 'tab-id', 'https://example.com');

  const response = messenger.send<number, string>('chainChanged:example.com', 137, { id: 7 });

  expect(injectJavaScript).toHaveBeenCalledWith('window.postMessage({"topic":"> chainChanged:example.com","payload":137,"id":7})');

  messenger.dispatch({
    data: {
      topic: '< chainChanged:example.com',
      payload: { response: 'wrong response' },
      id: 8,
    },
    meta: { sender: {} },
  });
  messenger.dispatch({
    data: {
      topic: '< chainChanged:example.com',
      payload: { response: 'handled' },
      id: 7,
    },
    meta: { sender: {} },
  });

  await expect(response).resolves.toBe('handled');
});
