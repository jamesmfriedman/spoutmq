import ioServer from 'socket.io';
import { Server } from 'net';
import { matchRoutingKey } from './match-routing-key';

export const createSpoutServer = (server: Server) => {
  const io = ioServer(server, { pingTimeout: 30000 });
  const namespaces: { [key: string]: ioServer.Namespace } = {};

  const makeNamespace = ({ pattern }: { pattern: string }) => {
    if (pattern && !namespaces[pattern]) {
      const nsp = io.of('/' + encodeURIComponent(pattern));
      console.log('Making namespace', pattern);
      namespaces[pattern] = nsp;
      return nsp;
    } else if (pattern) {
      console.log('Namespace exists', pattern, namespaces[pattern].name);
    }
  };

  let consumeCallback: (args: {
    routingKey: string;
    data: any;
    userId: string;
  }) => void = () => {};

  // middleware
  io.use((socket, next) => {
    const pattern = socket.handshake.query.pattern;

    const nsp = makeNamespace({ pattern: decodeURIComponent(pattern) });

    if (nsp) {
      if (pattern.startsWith('spoutmqUser')) {
        nsp.on('connect', socket => {
          socket.on('publish', (routingKey: string, data: any) => {
            console.log(routingKey);
            console.log('Someone published', data);
            consumeCallback({
              userId: socket.handshake.query.userId,
              data,
              routingKey
            });
          });

          socket.on('namespace', (namespace: string) => {
            console.log('Creating namespace', namespace);
            makeNamespace({ pattern: encodeURIComponent(namespace) });
            socket.emit('namespaceCreated', namespace);
          });
        });
      }
    }
    next();
  });

  io.on('connection', socket => {
    console.log('CONNECTED');
    socket.on('namespace', namespace => {
      console.log('NAMESAPCE', namespace);
    });
  });

  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    next();
  });

  const publish = ({ routingKey, data }: { routingKey: string; data: any }) => {
    for (const key in namespaces) {
      if (matchRoutingKey({ actual: routingKey, expected: key })) {
        console.log('Emitting for', routingKey, key);
        namespaces[key].emit('data', data);
      }
    }
  };

  return {
    publish,
    consume: (
      callback: (args: {
        routingKey: string;
        data: any;
        userId: string;
      }) => void
    ) => {
      consumeCallback = callback;
    }
  };
};

export default createSpoutServer;
