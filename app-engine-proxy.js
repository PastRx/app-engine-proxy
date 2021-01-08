var https = require('https');
var URL = require('url').URL;
var httpProxy = require('http-proxy');
var secretManager = require('./secret-manager');

var httpsOptions = {
  key: null,
  cert: null,
  ca: null
}

/**
 * Builds the HTTPS Options for server and cleint SSL
 * 
 * @return {Promise[undefined, undefined, undefined]}
 */
async function buildHTTPSOptions() {
  let p1 = secretManager.getProxyClientPrivateKey().then(key => { httpsOptions.key = key });
  let p2 = secretManager.getProxyClientCRT().then(cert => { httpsOptions.cert = cert });
  let p3 = secretManager.getProxyClientCA().then(ca => { httpsOptions.ca = [ca] });

  return Promise.all([p1, p2, p3]);
}

/**
 * Starts the proxy server, requires httpsOptions
 */
function startServer() {
  var respond = function (status, msg, res) {
    res.writeHead(status, { 'content-type': 'text/plain' });
    res.write(msg);
    res.end();
  }

  var proxy = httpProxy.createProxyServer({ ssl: httpsOptions });

  var server = https.createServer(httpsOptions, function (req, res) {
    if (req.url == '/health-check') {
      return respond(200, '', res);
    }

    if (!req.headers['x-target']) {
      return respond(400, 'required header "X-Target" not found', res);
    }

    var target = req.headers['x-target'];
    var targetUrl = new URL(target);

    // https://github.com/http-party/node-http-proxy/blob/master/lib/http-proxy/index.js#L65
    // force client cert for client ssl cert authentication
    if(req.headers['x-send-client-cert'] === 'true') {
      targetUrl.key = httpsOptions.key;
      targetUrl.cert = httpsOptions.cert;
    }

    proxy.web(req, res, {
      target: targetUrl.href,
      changeOrigin: true,
    });

  });

  server.listen(443);
}

buildHTTPSOptions().then((values) => startServer());