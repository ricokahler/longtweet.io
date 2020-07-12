import React from 'react';
import { render } from 'react-dom';
import Post from '../components/post';
import '../components/app.css';
import './init-author-controls';

const container = document.createElement('div');
document.body.appendChild(container);

console.log('test');

render(
  <Post
    title="Once upon a time"
    user="987520772"
    postId="test-post"
    createdDate={new Date().toISOString()}
    handle="ricokahler"
    text={`
# this is a thing

1. test
2. test
3. test

## no xss 

\`\`\`
<button>click</button>
function thing() {
  stuff fjeiwo fjieowa jfiewo afjeiw oafj eiwao fjeiw ofjew iafoe jwaof 
}
\`\`\`

<script>alert('test')</script>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Bleep bloop blop.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    `.trim()}
  />,
  container,
);

