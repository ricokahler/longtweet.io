import React, { useState } from 'react';
import TwitterLogo from './twitter-logo';
import CircleNotch from './circle-notch';
import { Redirect } from './router';
import { useUser } from './user';
import { login } from './auth';

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

  if (user.loggedIn) {
    return <Redirect to="/compose" />;
  }

  return (
    <>
      <h1 className="title">What is longtweet.io?</h1>
      <p>
        Longtweet is an <a href="#">open-source</a>, ad&#8209;free,
        tracker&#8209;free, free&#8209;to&#8209;use service that lets you post
        your long thoughts.
      </p>
      <p>That's right. No ads. No trackers. As simple as that.</p>
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
    </>
  );
}

export default Home;
