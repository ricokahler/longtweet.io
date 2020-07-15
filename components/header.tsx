import React from 'react';
import { useUser } from './user';
import Profile from './profile';

function Header() {
  const user = useUser();

  return (
    <header className="header container">
      <div className="header-info">
        <a href="/" className="brand">
          longtweet.io&nbsp;
        </a>
        <span className="caption">— simple ad-free posts</span>
      </div>
      <div className="spacer" />
      <a className="compose-button caption new-post-button" href="/compose">
        New post
      </a>
      <a
        style={{ display: user.loggedIn ? undefined : 'none' }}
        className="button header-button"
        title="My Account"
        id="my-account"
        href="/account"
      >
        <Profile />
      </a>
    </header>
  );
}

export default Header;
