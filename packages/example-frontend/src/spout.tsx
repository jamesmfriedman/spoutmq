import { connect } from '@spoutmq/client';

export const spoutClient = connect({
  url: 'http://localhost:3001',
  userId: window.location.search.slice(1)
});

export default spoutClient;
