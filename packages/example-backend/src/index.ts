import './polyfills';
import 'module-alias/register';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import socketIO from 'socket.io';
import amqp from 'amqplib/callback_api';
import { matchRoutingKey } from './match-routing-key';

const SERVICE_NAME = 'SpoutMQ Example App';
const PORT = 3001;
const STATIC_PATH = path.resolve('lib/public');
const app = express();
const server = createServer(app);
const io = socketIO(server);

app.use(express.static(STATIC_PATH));

app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_PATH + '/index.html'));
});

const connections: { [key: string]: socketIO.Socket } = {};
const namespaces: { [key: string]: socketIO.Namespace } = {};

amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = 'hello';
    var exchange = 'default';

    channel.assertExchange(exchange, 'topic', {
      durable: true
    });

    channel.assertQueue(queue, {
      durable: true
    });

    channel.bindQueue(queue, exchange, '#');

    channel.consume(queue, function(msg) {
      const routingKey = msg.fields.routingKey;
      for (const key in namespaces) {
        if (matchRoutingKey({ actual: routingKey, expected: key })) {
          console.log('Emitting for', routingKey, key);
          namespaces[key].emit('event', routingKey);
        }
      }
    });
  });
});

// middleware
io.use((socket, next) => {
  const pattern = socket.handshake.query.pattern;
  const decodedPattern = pattern && decodeURIComponent(pattern);

  console.log('Found Pattern', pattern);
  if (decodedPattern && !namespaces[decodedPattern]) {
    const nsp = io.of(pattern);
    console.log('Making namespace', pattern);
    nsp.on('connection', function(socket) {
      console.log('someone connected', decodedPattern);
    });
    namespaces[decodedPattern] = nsp;
  }

  next();
});

io.use((socket, next) => {
  const token = socket.handshake.query.token;
  next();
});

// io.on('connection', socket => {
//   connections[socket.handshake.query.token] = socket;
//   socket.on('event', data => {
//     console.log('Server', data);
//   });
//   socket.on('disconnect', () => {
//     delete connections[socket.handshake.query.token];
//     console.log('disconnect');
//   });
//   io.emit('event', { data: 'from server' + Math.random() });
// });

const main = () => {
  server.listen(PORT, () =>
    console.log(`${SERVICE_NAME} listening on port ${PORT}!`)
  );
};

main();
