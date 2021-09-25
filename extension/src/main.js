/* eslint-disable import/no-commonjs */

const fs = require('fs');
const path = require('path');

const inject = `
  var frame = unescape('${escape(
    fs.readFileSync(path.join(__dirname, '../dist/provider.js')).toString()
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
fs.writeFile(path.join(__dirname, '../dist/inject.js'), inject, err => {
  if (err) throw err;
});
