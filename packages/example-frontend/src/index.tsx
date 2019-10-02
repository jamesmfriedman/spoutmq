import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';
import { connect } from '@spoutmq/client';

const init = () => {
  const conn = connect({
    url: 'http://localhost:3001',
    token: window.location.search.slice(1)
  });

  conn.subscribe({ pattern: 'user.events.#' });
  ReactDOM.render(<App />, document.getElementById('root'));
};

init();
