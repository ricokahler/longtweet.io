import React from 'react';

function Footer() {
  return (
    <footer className="footer container">
      <ul className="horizontal-list caption">
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/terms">Terms</a>
        </li>
        <li>
          <a href="/privacy">Privacy</a>
        </li>
      </ul>
      <p className="caption footer-paragraph">
        longtweet is a fast and reliable{' '}
        <a href="https://github.com/ricokahler/longtweet.io">open-source</a>{' '}
        blogging service created by{' '}
        <a href="https://twitter.com/rico_kahler">@rico_kahler</a> — offered
        ad-free
      </p>
    </footer>
  );
}

export default Footer;
