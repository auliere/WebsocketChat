global.api = {};
api.fs = require('fs');
api.http = require('http');
api.websocket = require('websocket');

var index = api.fs.readFileSync('./index.html');

var prefix = '/images/smileys/';
var files = api.fs.readdirSync('.'+prefix);
var smMap = {};
for(element in files) {
  smMap[':' + files[element].slice(0,-4) + ':'] = prefix + files[element];
}

var server = api.http.createServer(function(req, res) {
  console.log(req.url);
  if(req.url.substring(0, prefix.length) == prefix  &&
      req.url.indexOf('..') === -1 ) {
        console.log('blah');
    api.fs.readFile('.' + req.url, function(err, fileData) {
      res.writeHead(200, {'Content-Type': 'image/png' });
      res.end(fileData, 'binary');
    });
  } else {
    res.writeHead(200);
    res.end(index);
  }
});

server.listen(80, function() {
  console.log('Listen port 80');
});

var ws = new api.websocket.server({
  httpServer: server,
  autoAcceptConnections: false
});

var clients = [];

ws.on('request', function(req) {
  var connection = req.accept('', req.origin);
  clients.push(connection);
  console.log('Connected ' + connection.remoteAddress);
  connection.send(JSON.stringify({smileyMap : smMap}));
  connection.on('message', function(message) {
    var dataName = message.type + 'Data',
        data = { message: message[dataName] };
    console.log('Received: ' + data.message);
    clients.forEach(function(client) {
    console.log(JSON.stringify(data));
      if (connection !== client) {        
        client.send(JSON.stringify(data));
      }
    });
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});
