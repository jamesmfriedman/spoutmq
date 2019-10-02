import React, { useEffect } from 'react';
import './app.css';
import { spoutClient } from './spout';

function App() {
  const subscribe = (pattern: string) => {
    spoutClient.subscribe({ pattern });
  };

  const unsubscribe = (pattern: string) => {
    spoutClient.unsubscribe({ pattern });
  };

  useEffect(() => {
    setTimeout(() => {
      subscribe('user.events.hello');
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <label>Subscribe</label>
        <input
          onBlur={evt => {
            subscribe(evt.currentTarget.value);
          }}
        />

        <label>Unsubscribe</label>
        <input
          onBlur={evt => {
            unsubscribe(evt.currentTarget.value);
          }}
        />

        <label>Message</label>
        <input id="input" />

        <button
          onClick={() =>
            spoutClient.publish({
              key: 'user.events.hello',
              // @ts-ignore
              data: document.getElementById('input').value
            })
          }
        >
          Publish
        </button>
      </header>
    </div>
  );
}

export default App;
