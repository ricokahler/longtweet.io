import React from 'react';
import { useUser } from './user';
import { useRouter } from './router';
import Profile from './profile';

function Header() {
  const user = useUser();
  const router = useRouter();

  return (
    <header className="header container">
      {router.path === '/compose' ? (
        <div className="brand">longtweet.io&nbsp;</div>
      ) : (
        <a href="/" className="brand">
          longtweet.io&nbsp;
        </a>
      )}
      <span className="brand-subtitle caption">
        — simple ad-free, tracker-free posts
      </span>
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
