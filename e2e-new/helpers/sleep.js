/* eslint-disable no-empty */
/* eslint-disable no-undef */
function sleep(timeInSeconds) {
  console.log(`starting timeout of ${timeInSeconds} seconds`);
  const t = new Date().getTime() + timeInSeconds * 1000;
  while (new Date().getTime() <= t) {}
  console.log('timeout finished');
}

sleep(seconds);
