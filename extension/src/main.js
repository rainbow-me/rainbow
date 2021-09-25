/* eslint-disable import/no-commonjs */

const fs = require('fs');
const path = require('path');

const inject = `
  var frame = unescape('${escape(
    fs
      .readFileSync(
        path.join(
          __dirname,
          '../../ios/Rainbow Bridge/Resources/dist/provider.js'
        )
      )
      .toString()
  )}')
  try {
    let script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.innerText = frame
    script.onload = function () { this.remove() }
    document.head ? document.head.prepend(script) : document.documentElement.prepend(script)
  } catch (e) {
    console.log(e)
  }
`;
fs.writeFileSync(
  path.join(__dirname, '../../ios/Rainbow Bridge/Resources/dist/inject.js'),
  inject
);
