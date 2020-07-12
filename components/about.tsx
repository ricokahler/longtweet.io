import React from 'react';

function About() {
  return (
    <>
      <h1 className="title">About</h1>
      <h2 id="what-is">What is longtweet.io?</h2>
      <p>
        Longtweet is an{' '}
        <a href="https://github.com/ricokahler/longtweet.io">open-source</a>,
        ad‑free, tracker‑free, free‑to‑use service that lets you post your long
        thoughts.
      </p>
      <p>That's right. No ads. No trackers. As simple as that.</p>
      <h2 id="why">Why?</h2>
      <p>
        There have been other sites like this one that have empowered others to
        share important messages with their audiences.
      </p>
      <p>
        It's clear to me that sites like these are valuable and needed —
        especially in times we live in today.
      </p>
      <p>
        The difference here is that this site is determined to be highly
        performant and ad-free through simplicity and efficient architecture.
      </p>
      <p>
        That way your message can reach as many people as possible while not
        being cluttered by any noise.
      </p>
      <h2 id="how">How?</h2>
      <p>
        When you create a post, it creates an HTML and drops that page directly
        into <a href="https://aws.amazon.com/s3/">Amazon S3</a>.
      </p>
      <p>That S3 bucket hosts this website so once it's uploaded, it's live.</p>
      <p>
        <a href="https://aws.amazon.com/s3/pricing/">
          S3 storage and access is very cheap
        </a>{' '}
        and this website is very small (each post is rough 2kB-5kB) in size.
        Each page view costs roughly $0.0000004-$0.000002.
      </p>
      <p>
        Though there are other costs, the main cost of viewing a post is
        drastically reduced with this model and is enough for me to support it
        out of pocket for the time being.
      </p>
      <p>
        If you’re a developer yourself, feel free to checkout{' '}
        <a href="https://github.com/ricokahler/longtweet.io">the source code</a>{' '}
        for this project. It's MIT licensed.
      </p>
    </>
  );
}

export default About;
