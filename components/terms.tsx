import React from 'react';

function Terms() {
  return (
    <>
      <h1>Terms of Service</h1>
      <ul>
        <li>
          In order to use this service, you must have a Twitter account and
          therefore must be able to use their service and abide by their
          requirements for use. In particular, you must be at least 13 years old
          to use this service.
        </li>
        <li>
          Privacy is covered <a href="/privacy">here</a>.
        </li>
        <li>
          You are responsible for any content you provide, including compliance
          with applicable laws, rules, and regulations.
        </li>
        <li>We reserve the right to remove any content for any reason.</li>
        <li>
          This service is offered "as-is" without any warranty of any kind.
        </li>
        <li>There are no uptime guarantees.</li>
        <li>These terms may change.</li>
      </ul>

      <p>
        This software is MIT Licensed.{' '}
        <a href="https://github.com/ricokahler/longtweet.io/blob/master/LICENSE">
          See here
        </a>{' '}
        for more legal info.
      </p>
    </>
  );
}

export default Terms;
