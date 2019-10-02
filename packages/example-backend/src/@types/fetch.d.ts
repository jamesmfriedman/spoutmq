import { default as nodeFetch } from 'node-fetch';

declare global {
  const fetch: typeof nodeFetch;
}

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof nodeFetch;
    }
  }
}
