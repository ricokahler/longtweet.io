import { getLoggedIn, getUserInfo } from '../src/app/auth';

function initAuthorControls() {
  if (!getLoggedIn()) {
    return;
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

  authorControls.style.display = null;

  const deleteButton = document.querySelector<HTMLButtonElement>('#delete');
  deleteButton.addEventListener('click', () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this post?\n' +
          'NOTE: deletion requests take a bit.',
      )
    ) {
      return;
    }
  });
}

export default initAuthorControls;
