import { getLoggedIn, getUserInfo } from './auth';

function initPostControls() {
  const createdDate = document.querySelector<HTMLSpanElement>('#created-date');
  if (createdDate) {
    createdDate.innerText = new Date(
      createdDate.innerText.trim(),
    ).toLocaleString();
  }

  if (!getLoggedIn()) {
    return;
  }

  const myAccount = document.querySelector<HTMLAnchorElement>('#my-account');
  if (myAccount) {
    myAccount.style.display = 'inline';
  }

  const userInfo = getUserInfo();
  if (!userInfo) {
    return;
  }

  const authorControls = document.querySelector<HTMLDivElement>(
    '#author-controls',
  );
  if (!authorControls) {
    return;
  }

  if (userInfo.user.toString() !== authorControls.dataset.user) {
    return;
  }

  authorControls.style.display = '';

  const deleteButton = document.querySelector<HTMLButtonElement>('#delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      if (
        !window.confirm(
          'Are you sure you want to delete this post? This action cannot be undone.\nNOTE: This will not delete any related tweets.',
        )
      ) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('no token');
        }

        const postId = authorControls.dataset.postId;
        if (!postId) {
          throw new Error('no post id');
        }

        const response = await fetch('https://api.longtweet.io/delete-post', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: postId,
          }),
        });

        if (!response.ok) {
          throw new Error('not okay error');
        }

        window.location.assign('/deleted');
      } catch {
        alert(
          'Sorry, something went wrong while trying to delete your post. Please try again.',
        );
      }
    });
  }
}

setTimeout(() => {
  initPostControls();
}, 0);
