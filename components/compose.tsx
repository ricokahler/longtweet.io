import React, { useState, useEffect, useRef } from 'react';
import usePull from 'use-pull';
import PaperPlane from './paper-plane';
import { useUser } from './user';
import { getToken } from '../helpers/auth';
import CircleNotch from './circle-notch';
import fetch from '../helpers/wrapped-fetch';
import Redirect from './redirect';

function Compose() {
  const user = useUser();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const postedRef = useRef(false);

  const getTitle = usePull(title);
  const getText = usePull(text);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const title = getTitle();
      const text = getText();

      if (postedRef.current) {
        return;
      }

      if (title || text) {
        // Cancel the event as stated by the standard.
        e.preventDefault();
        // Chrome requires returnValue to be set.
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [getTitle, getText]);

  if (!user.loggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <input
        className="title title-input"
        type="text"
        placeholder="Title"
        autoFocus
        defaultValue=""
        onChange={(e) => setTitle(e.currentTarget.value)}
      />
      <p className="caption">
        <sup>*</sup>For <em>really</em> long posts, we advise you to copy/paste
        from your notes or something.
        <br />
        Press enter twice for new paragraphs.
        <br />
        {user.handle && (
          <>
            <span className="emoji" role="img" aria-label="wave">
              👋
            </span>{' '}
            Writing as{' '}
            <a
              href={`https://twitter.com/${user.handle}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              @{user.handle}
            </a>
          </>
        )}
      </p>
      <textarea
        className="post-textarea"
        placeholder="Write your post…"
        onChange={(e) => {
          const { currentTarget } = e;
          setText(currentTarget.value);
          currentTarget.style.height = '1px';
          currentTarget.style.height = `${e.currentTarget.scrollHeight + 5}px`;
        }}
      />
      {text.length > 300000 && (
        <p className="caption">
          To prevent this platform from being abused, we limit posts to 300,000
          characters (roughly 100 single-spaced pages).
        </p>
      )}
      <button
        className="compose-button"
        disabled={!text || text.length > 300000 || loading}
        onClick={async () => {
          setLoading(true);
          if (
            !window.confirm(
              "Are you sure want to post this?\nYou'll get the chance to post it to Twitter after.",
            )
          ) {
            setLoading(false);
            return;
          }

          try {
            const response = await fetch('/create-post', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title, text }),
            });

            if (!response.ok) {
              throw new Error();
            }

            const { id } = await response.json();
            postedRef.current = true;
            window.location.assign(`/${id}`);
          } catch {
            alert(
              "We're sorry. Something went wrong.\nYour session may have expired. Please try logging out and try again.\n\nReport any bugs via DM to @longtweetio",
            );
            setLoading(false);
            postedRef.current = false;
          }
        }}
      >
        <span>Save</span>
        {loading ? <CircleNotch /> : <PaperPlane />}
      </button>
      <p className="caption">
        <strong>Note:</strong> This will <em>not</em> post to Twitter yet.
      </p>
    </>
  );
}

export default Compose;
