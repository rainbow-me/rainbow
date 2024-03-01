import { IMessageSender } from '@rainbow-me/provider';

import { CallbackFunction, SendMessage, createMessenger, isValidReply, isValidSend } from './createMessenger';
import WebView from 'react-native-webview';

export const appMessenger = (webViewRef: WebView, tabId: string, url: string) => {
  const listeners: { [topic: string]: (event: MessageEvent) => void } = {};

  return {
    ...createMessenger({
      available: true,
      name: 'appMessenger',
      async send(topic, payload, { id } = {}) {
        const data = { topic: `> ${topic}`, payload, id };
        webViewRef.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
        // ... and also set up an event listener to listen for the response ('< {topic}').
        return new Promise((resolve, reject) => {
          const listener = (event: MessageEvent) => {
            if (!isValidReply({ id, message: event.data, topic })) return;
            const { response, error } = event.data.payload;
            delete listeners[topic];
            if (error) reject(new Error(error.message));
            resolve(response);
          };
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          listeners[topic] = listener as (event: MessageEvent) => void;

          window.addEventListener('message', listener);
        });
      },
      reply<TPayload, TResponse>(topic: string, callback: CallbackFunction<TPayload, TResponse>) {
        const listener = async (event: MessageEvent<SendMessage<TPayload>>) => {
          if (!isValidSend({ message: event.data, topic })) return;

          let error;
          let response;
          try {
            response = await callback(event.data.payload, {
              topic: event.data.topic,
              sender: event.source as IMessageSender,
              id: event.data.id,
            });
          } catch (error_) {
            error = error_;
          }

          const repliedTopic = event.data.topic.replace('>', '<');
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.ReactNativeWebView.postMessage({
            topic: repliedTopic,
            payload: { error, response },
            id: event.data.id,
          });
        };

        listeners[topic] = listener as (event: MessageEvent) => void;

        return () => {
          delete listeners[topic];
        };
      },
    }),
    url,
    tabId,
    listeners,
  };
};
