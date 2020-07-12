import React from 'react';
import { Router } from '../components/router';
import { UserProvider } from '../components/user';
import Header from '../components/header';
import Footer from '../components/footer';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt('default', {});

interface Props {
  title: string;
  text: string;
  user: string;
  postId: string;
}

function Post({ title, text, user, postId }: Props) {
  return (
    <Router>
      <UserProvider>
        <Header />
        <main className="container">
          <div
            id="author-controls"
            className="author-controls caption"
            data-user={user.toString()}
            style={{ display: 'none' }}
          >
            <div className="author-controls__description">
              <span role="img" aria-label="wave">
                👋
              </span>{' '}
              This is your post.
            </div>
            <a
              className="author-controls__tweet-it button"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `https://longtweet.io/${postId}`,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Tweet
            </a>
            <button id="delete" className="author-controls__delete-it button">
              Delete
            </button>
          </div>
          {title && <h1 className="title">{title}</h1>}
          <article dangerouslySetInnerHTML={{ __html: md.render(text, {}) }} />
        </main>
        <Footer />
      </UserProvider>
    </Router>
  );
}

export default Post;
