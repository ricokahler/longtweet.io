import React from 'react';

function Footer() {
  return (
    <footer className="footer container">
      <ul className="horizontal-list caption">
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/about#ad-free">Ad free?</a>
        </li>
        <li>
          <a href="/about#tracker-free">Tracker free?</a>
        </li>
        <li>
          <a href="/privacy">Privacy</a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
