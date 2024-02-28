function init() {
  window.addEventListener(
    'message',
    event => {
      if (event.data.payload === 'ping') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'message', data: 'pong' }));
      }
    },
    false
  );
}

init();
