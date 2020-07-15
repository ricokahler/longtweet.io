import React, { useState } from 'react';
import TwitterLogo from './twitter-logo';
import CircleNotch from './circle-notch';
import { useUser } from './user';
import { login } from '../helpers/auth';

function Home() {
  const user = useUser();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      await login();
    } catch {
      setLoggingIn(false);
    }
  };

  return (
    <>
      <h1 className="title">What is longtweet.io?</h1>
      <p>
        Longtweet is an{' '}
        <a href="https://github.com/ricokahler/longtweet.io">open-source</a>,
        ad&#8209;free, tracker&#8209;free, free&#8209;to&#8209;use service that
        lets you post your long thoughts.
      </p>
      <p>That's right. No ads. No trackers. As simple as that.</p>
      {user.loggedIn ? (
        <a href="/compose">Create a new post →</a>
      ) : (
        <button
          className="twitter-button"
          onClick={handleLogin}
          disabled={loggingIn}
        >
          {loggingIn ? (
            <CircleNotch className="twitter-logo" />
          ) : (
            <TwitterLogo className="twitter-logo" />
          )}
          &nbsp;Sign in with Twitter
        </button>
      )}
    </>
  );
}

export default Home;
