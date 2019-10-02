import io from 'socket.io-client';

interface ConnectOptions {
  url: string;
  token: string;
  connectionOptions?: SocketIOClient.ConnectOpts;
}

interface SubscribeOptions {
  pattern: string;
}

const subscribe = ({ url, connectionOptions = {} }: ConnectOptions) => (
  ...args: SubscribeOptions[]
) => {
  for (const { pattern } of args) {
    const safePattern = encodeURIComponent(pattern);
    console.log('Subscribing to topic', pattern);
    const socket = io(`${url}/${safePattern}`, {
      ...connectionOptions,
      query: {
        ...connectionOptions,
        pattern: safePattern
      }
    });

    socket.on('connect', function() {
      console.log('CONNECT');
    });
    socket.on('event', function(data: any) {
      console.log('EVENT', data);
    });

    socket.emit('event', { data: 'from client' + pattern });
  }
};

export const connect = ({
  url,
  token,
  connectionOptions: _connectionOptions = {}
}: ConnectOptions) => {
  const connectionOptions = {
    ..._connectionOptions,
    query: {
      ..._connectionOptions.query,
      token
    }
  };

  // const socket = io(url, connectionOptions);

  // socket.on('connect', function() {
  //   console.log('CONNECT');
  // });
  // socket.on('event', function(data: any) {
  //   console.log('EVENT', data);
  // });
  // socket.on('disconnect', function() {
  //   console.log('DISCONNECT');
  // });

  // socket.emit('event', { data: 'from client' });

  return {
    subscribe: subscribe({ url, token, connectionOptions })
  };
};
