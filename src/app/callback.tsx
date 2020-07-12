import React, { useEffect } from 'react';
import { Redirect } from './router';
import { handleCallback } from './auth';
import { useUser } from './user';
import CircleNotch from './circle-notch';

function Callback() {
  const user = useUser();

  useEffect(() => {
    handleCallback().catch((e) => {
      console.error(e);
    });
  }, []);

  if (user.loggedIn) {
    return <Redirect to="/compose" />;
  }

  return (
    <div>
      <CircleNotch className="callback-spinner" />
      <h1 className="title center-text">Logging you in…</h1>
    </div>
  );
}

export default Callback;
