import io from 'socket.io-client';

interface ConnectOptions {
  url: string;
  userId: string;
  connectionOptions?: SocketIOClient.ConnectOpts;
}

interface SubscribeOptions {
  pattern: string;
}

interface Subscriptions {
  [key: string]: SocketIOClient.Socket;
}

const subscribe = ({
  url,
  connectionOptions = {},
  subscriptions
}: ConnectOptions & { subscriptions: Subscriptions }) => (
  ...args: SubscribeOptions[]
) => {
  for (const { pattern } of args) {
    if (subscriptions[pattern]) {
      console.log('Already subscribed to.', pattern);
      continue;
    }

    if (!pattern.trim()) {
      console.log('No valid pattern to subscribe to.');
      continue;
    }

    const safePattern = encodeURIComponent(pattern);
    console.log('Subscribing to topic', pattern);
    const socket = io(`${url}/${safePattern}`, {
      ...connectionOptions,
      query: {
        ...connectionOptions.query,
        pattern: safePattern
      }
    });

    socket.on('connect', function() {
      console.log('CONNECT');
    });
    socket.on('data', function(data: any) {
      console.log('Received', data);
    });

    subscriptions[pattern] = socket;
    return socket;
  }
};

const unsubscribe = ({ subscriptions }: { subscriptions: Subscriptions }) => (
  ...args: SubscribeOptions[]
) => {
  for (const { pattern } of args) {
    if (subscriptions[pattern]) {
      console.log('Removing subscription for', pattern);
      subscriptions[pattern].disconnect();
      delete subscriptions[pattern];
    }
  }
};

const unsubscribeAll = ({
  subscriptions
}: {
  subscriptions: Subscriptions;
}) => () => {
  for (const key in subscriptions) {
    subscriptions[key].close();
  }
};

const publish = ({ socket }: { socket: SocketIOClient.Socket }) => ({
  key,
  data
}: {
  key: string;
  data: any;
}) => {
  console.log('Publishing', data);
  socket.emit('publish', key, data);
};

export const connect = ({
  url,
  userId,
  connectionOptions: _connectionOptions = {}
}: ConnectOptions) => {
  const connectionOptions = {
    ..._connectionOptions,
    query: {
      ..._connectionOptions.query,
      userId
    }
  };

  const subscriptions = {};
  const boundSubscribe = subscribe({
    url,
    userId,
    connectionOptions,
    subscriptions
  });

  // subscribe to users namespace
  const socket = boundSubscribe({ pattern: `spoutmqUser.${userId}.#` });
  socket.on('namespaceCreated', (namespace: string) => {
    boundSubscribe({ pattern: namespace });
  });

  return {
    publish: publish({ socket }),
    subscribe: (...args: SubscribeOptions[]) => {
      for (const { pattern } of args) {
        socket.emit('namespace', pattern);
      }
    },
    unsubscribe: unsubscribe({ subscriptions }),
    unsubscribeAll: unsubscribeAll({ subscriptions })
  };
};
