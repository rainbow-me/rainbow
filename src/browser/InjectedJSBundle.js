// function init() {
//   window.addEventListener(
//     'message',
//     event => {
//       if (event.data.payload === 'ping') {
//         window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'message', data: 'pong' }));
//       }
//     },
//     false
//   );
// }

// init();

function isValidSend({ topic, message }) {
  if (!message.topic) return false;
  if (topic !== '*' && message.topic !== `> ${topic}`) return false;
  if (topic === '*' && message.topic.startsWith('<')) return false;
  return true;
}

function isValidReply({ id, topic, message }) {
  if (message.topic !== `< ${topic}`) return;
  if (typeof id !== 'undefined' && message.id !== id) return;
  if (!message.payload) return;
  return true;
}

function createMessenger(messenger) {
  return messenger;
}

const webviewMessenger = createMessenger({
  available: typeof window !== 'undefined',
  name: 'webviewMessenger',
  async send(topic, payload, { id } = {}) {
    // Since the window messenger cannot reply asynchronously, we must include the direction in our message ('> {topic}')...
    window.postMessage({ topic: `> ${topic}`, payload, id }, '*');
    // ... and also set up an event listener to listen for the response ('< {topic}').
    return new Promise((resolve, reject) => {
      const listener = event => {
        if (!isValidReply({ id, message: event.data, topic })) return;
        if (event.source != window) return;

        window.removeEventListener('message', listener);

        const { response, error } = event.data.payload;
        if (error) reject(new Error(error.message));
        resolve(response);
      };
      window.addEventListener('message', listener);
    });
  },
  reply(topic, callback) {
    const listener = async event => {
      if (!isValidSend({ message: event.data, topic })) return;

      const sender = event.source;
      if (sender != window) return;

      let error;
      let response;
      try {
        response = await callback(event.data.payload, {
          topic: event.data.topic,
          sender: event.source,
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
    window.addEventListener('message', listener, false);
    return () => window.removeEventListener('message', listener);
  },
});

webviewMessenger.reply('*', async payload => {
  alert('Webview got message' + JSON.stringify(payload));
  webviewMessenger.send('pong', { message: 'world' });
});
