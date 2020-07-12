import { getLoggedIn, getUserInfo } from './auth';

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

  authorControls.style.display = '';

  const deleteButton = document.querySelector<HTMLButtonElement>('#delete');
  if (!deleteButton) {
    return;
  }

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
