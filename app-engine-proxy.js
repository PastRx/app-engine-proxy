var https = require('https');
var http = require('http');
var util = require('util');
var path = require('path');
var fs = require('fs');
var url = require('url');
var httpProxy = require('http-proxy');

var respond = function(status, msg, res){
  res.writeHead(status, {'content-type': 'text/plain'});
  res.write(msg);
  res.end();
}

var getHTTPSOptions = function() {
  return JSON.parse(fs.readFileSync('config.json', 'utf8')).keyCert;
}

var getHTTPSOptions = function() {
  return JSON.parse(fs.readFileSync('config.json', 'utf8')).keyCert;
}

var proxy = httpProxy.createProxyServer({});

proxy.on('proxyReq', function (proxyReq, req, res) {
});

proxy.on('proxyRes', function (proxyRes, req, res) {
});

// var server = http.createServer(function(req, res) {
var server = https.createServer(httpsOptions, function(req, res) {
  console.log(req.url);
  if(req.url == '/health-check') {
    return respond(200, '', res);
  }

  if(!req.headers['x-target']) {
    return respond(400, 'required header "X-Target" not found', res);
  }

  var target = req.headers['x-target'];
  var proxyURL = url.parse(target);
  var host = proxyURL.host;
  var protocol = proxyURL.protocol;
  var agent = (protocol == 'https:' ? https.globalAgent:http.globalAgent);
  req.url = '';

  proxy.web(req, res, {
    target: target,
    agent: agent,
    headers: {
        host: host
    }
  });
});

// server.listen(8585);
server.listen(443);
