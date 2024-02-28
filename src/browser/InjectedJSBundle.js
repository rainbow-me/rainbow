function init() {
  window.addEventListener(
    'message',
    event => {
      alert('received event: ' + JSON.stringify(event.data));
      if (event.data.payload === 'ping') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'message', data: 'pong' }));
      }
    },
    false
  );
}

init();
