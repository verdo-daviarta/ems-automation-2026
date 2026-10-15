const passwordField = document.querySelector('#password');
const togglePasswordButton = document.querySelector('[data-testid="toggle-password"]');
const loginForm = document.querySelector('form');
const errorMessage = document.querySelector('[data-testid="login-error"]');
const lockToast = document.querySelector('[data-testid="login-lock-toast"]');

togglePasswordButton.addEventListener('click', () => {
  passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.querySelector('#email').value;
  const password = passwordField.value;

  if (!email || !password) {
    errorMessage.textContent = 'Email dan password wajib diisi';
    errorMessage.hidden = false;
    return;
  }

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    location.assign('/dashboard');
    return;
  }

  const { message } = await response.json();
  lockToast.textContent = message;
  lockToast.hidden = false;

  if (!message.startsWith('Akun terkunci.')) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }
});
