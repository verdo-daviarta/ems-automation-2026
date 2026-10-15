const logoutButton = document.querySelector('[data-testid="logout"]');

logoutButton.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.assign('/login');
});
