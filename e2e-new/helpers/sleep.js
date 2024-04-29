function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function process() {
  console.log('Sleep for 30 seconds');
  await sleep(30_000);
  console.log('Resuming Tests');
}

process();
