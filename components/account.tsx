import React, { useEffect, useState } from 'react';
import { getToken, logout } from '../helpers/auth';
import wrappedFetch from '../helpers/wrapped-fetch';
import { useUser } from './user';
import { Redirect } from './router';

interface Post {
  id: string;
  summary: string;
  createdDate: string;
}

function Account() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    async function getPosts() {
      setLoading(true);

      const token = getToken();
      const response = await wrappedFetch('/list-posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const postIds = await response.json();

      const posts: Post[] = [];

      for (const id of postIds) {
        const postResponse = await fetch(`/${id}`);
        const post = await postResponse.text();
        const match = /<!\[CDATA\[([^]*)]]>/.exec(post);
        if (!match) continue;
        try {
          const { summary, createdDate } = JSON.parse(match[1]);
          posts.push({ id, summary: atob(summary), createdDate });
        } catch {}
      }

      setLoading(false);
      setPosts(posts);
    }

    getPosts().catch((e) => {
      logout();
      console.error(e);
    });
  }, []);

  if (!user.loggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <div className="account-row">
        <h1 className="title">Your posts</h1>
        <button className="button logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : posts.length <= 0 ? (
        <p>
          Nothing here yet. <a href="/compose">Create a post?</a>
        </p>
      ) : (
        <ul className="post-list">
          {posts.map(({ id, createdDate, summary }) => (
            <li className="post-listing" key={id}>
              <a href={`/${id}`}>
                <div>{summary}</div>
                <div className="caption">
                  {new Date(createdDate).toLocaleString()}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default Account;
