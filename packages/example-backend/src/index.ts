import './polyfills';
import 'module-alias/register';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import amqp from 'amqplib/callback_api';
import { createSpoutServer } from '@spoutmq/server';

const SERVICE_NAME = 'SpoutMQ Example App';
const PORT = 3001;
const STATIC_PATH = path.resolve('lib/public');
const app = express();
const server = createServer(app);
const spoutServer = createSpoutServer(server);

app.use(express.static(STATIC_PATH));

app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_PATH + '/index.html'));
});

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

    channel.consume(
      queue,
      function(msg) {
        const routingKey = msg.fields.routingKey;
        spoutServer.publish({ routingKey, data: msg.content.toString() });
      },
      {
        noAck: false
      }
    );

    spoutServer.consume(({ routingKey, data, userId }) => {
      console.log('Publishing to Exchange', { routingKey, data, userId });
      channel.publish(exchange, routingKey, Buffer.from(data));
    });
  });
});

const main = () => {
  server.listen(PORT, () =>
    console.log(`${SERVICE_NAME} listening on port ${PORT}!`)
  );
};

main();
