var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var httpProxy = require('http-proxy');
//Logging
// winston 3 example.
const winston = require('winston');

// Imports the Google Cloud client library for Winston
const {LoggingWinston} = require('@google-cloud/logging-winston');

const loggingWinston = new LoggingWinston();

// Create a Winston logger that streams to Stackdriver Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    // Add Stackdriver Logging
    loggingWinston,
  ],
});


var respond = function(status, msg, res){
  res.writeHead(status, {'content-type': 'text/plain'});
  res.write(msg);
  res.end();
}

// //only used for HTTPS
// var getHTTPSOptions = function() {
//   return JSON.parse(fs.readFileSync('config.json', 'utf8')).keyCert;
// }
// var httpsOptions = {
//   key: fs.readFileSync(getHTTPSOptions().key),
//   cert: fs.readFileSync(getHTTPSOptions().cert),
//   ca: fs.readFileSync(getHTTPSOptions().ca)
// }


var proxy = httpProxy.createProxyServer({});

proxy.on('proxyReq', function (proxyReq, req, res) {
});

proxy.on('proxyRes', function (proxyRes, req, res) {
});

var httpsOptions = {
  pfx: fs.readFileSync('pastrx_cures_cert01.pfx'),
  passphrase: 'pastrx'
}


//var server = http.createServer(function(req, res) {
  //uncomment below for HTTPS support
  var server = https.createServer(httpsOptions, function(req, res) {
  if(req.url == '/health-check') {
    return respond(200, '', res);
  }

  if(!req.headers['x-target']) {
    console.log('required header "X-Target" not found');
    return respond(400, 'required header "X-Target" not found', res);
  }

  var target = req.headers['x-target'];
  var proxyURL = url.parse(target);
  var host = proxyURL.host;
  var protocol = proxyURL.protocol;
  var agent = (protocol == 'https:' ? https.globalAgent:http.globalAgent);
  req.url = '';

  console.log('proxy request to: ' + target);


  proxy.web(req, res, {
    target: target,
    agent: agent,
    headers: {
        host: host
    }
  });
});

server.listen(8585, function(){
  console.log('Server is listening on port 8585');
});
// server.listen(443);
