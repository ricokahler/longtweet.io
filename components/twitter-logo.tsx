import React from 'react';

function TwitterLogo(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg width="24" height="24" fill="currentColor" {...props}>
      <path d="M24 5h-3l2-2-3 1a5 5 0 00-8 4C8 8 4 6 2 3c-2 2-1 5 1 7L1 9c0 2 2 5 4 5H3c0 2 2 3 4 3-2 2-4 3-7 3l8 2c9 0 14-8 14-15l2-2z" />
    </svg>
  );
}

export default TwitterLogo;
