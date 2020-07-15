import React from 'react';
import { useUser } from './user';
import { useRouter } from './router';
import Profile from './profile';

function Header() {
  const user = useUser();
  const router = useRouter();

  return (
    <header className="header container">
      <div>
        {router.path === '/compose' ? (
          <div className="brand">longtweet.io&nbsp;</div>
        ) : (
          <a href="/" className="brand">
            longtweet.io&nbsp;
          </a>
        )}
        <span className="caption">— simple ad-free posts</span>
      </div>
      <div className="spacer" />
      {router.path !== '/compose' && (
        <a className="compose-button caption" href="/">
          New post
        </a>
      )}
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
