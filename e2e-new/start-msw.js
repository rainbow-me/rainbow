const { setupWorker } = require('msw');

const blockedUrls = [
  '.*api.thegraph.com.*',
  '.*raw.githubusercontent.com.*',
  '.*api.coingecko.com.*',
  '.*rainbow.imgix.net.*',
  '.*infura.io.*',
  '.*rainbow.me.*',
  '.*rainbowjiumask.dataplane.rudderstack.com.*',
  '.*rainbowme-res.cloudinary.com.*',
  '.*rainbow-proxy-rpc.rainbowdotme.workers.*',
  '.*localhost:8081/assets/src/assets.*',
];

const isBlockedUrl = url => {
  return blockedUrls.some(pattern => new RegExp(pattern).test(url));
};

const worker = setupWorker(
  // Intercept all requests
  (req, res, ctx) => {
    if (isBlockedUrl(req.url)) {
      // Block the request by returning an empty response with 404 status
      return res(ctx.status(404));
    }
    // Allow other requests to proceed
    return undefined;
  }
);

worker.start();
