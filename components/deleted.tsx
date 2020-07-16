import React from 'react';
import { useUser } from './user';
import Redirect from './redirect';

function NoRoute() {
  const user = useUser();

  if (!user.loggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <h1 className="title">Your post has been deleted</h1>
      <a href="/compose">Create a new post →</a>
    </>
  );
}

export default NoRoute;
