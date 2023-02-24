export const apiUrl = new URL('https://api.noroff.dev/api/v1');
export const apiPath = apiUrl.toString();

export const load = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export function updateLoginVisibility() {
  const token = load('token');
  document.body.classList[token ? 'add' : 'remove']('logged-in');
}

export const remove = (key) => localStorage.removeItem(key);

export const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export async function login(email, password) {
  const response = await fetch(`${apiPath}/auction/auth/login`, {
    method: 'post',
    body: JSON.stringify({ email, password }),
    headers: headers('application/json'),
  });

  if (response.ok) {
    const profile = await response.json();
    save('token', profile.accessToken);
    delete profile.accessToken;
    save('profile', profile);
    return profile;
  }

  throw new Error(response.statusText);
}

export const headers = (contentType) => {
  const token = load('token');
  const headers = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export function logout() {
  remove('token');
  remove('profile');
}

export async function register(name, email, password, avatar) {
  const response = await fetch(`${apiPath}/auction/auth/register`, {
    method: 'post',
    body: JSON.stringify({ name, email, password, avatar }),
    headers: headers('application/json'),
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(response.statusText);
}

export const isLoggedIn = () => Boolean(load('token'));

export const profile = () => load('profile');

export async function loginListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const email = data.get('email');
  const password = data.get('password');
  try {
    const { name } = await login(email, password);
    updateLoginVisibility();
    location.href = `./?view=profile&name=${name}`;
  } catch (error) {
    return alert(
      'Either your username was not found or your password is incorrect'
    );
  }
}
document
  .querySelector('form#loginForm')
  .addEventListener('submit', loginListener);

export async function registerListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const email = data.get('email');
  const name = data.get('name');
  const password = data.get('password');
  const avatar = data.get('avatar');

  try {
    await register(name, email, password, avatar);
  } catch (error) {
    return alert('There was a problem creating your account');
  }

  try {
    await login(email, password);
    location.reload();
  } catch (error) {
    return alert('There was a problem logging into your new account');
  }
}
document
  .querySelector('form#registerForm')
  .addEventListener('submit', registerListener);

export function logoutListener() {
  try {
    logout();
    updateLoginVisibility();
    location.href = './';
  } catch (error) {
    return alert('There was a problem logging out');
  }
}

document.querySelector('#logout').addEventListener('click', logoutListener);

export async function getInfo() {
  const response = await fetch(`${apiPath}/auction/listings`, {
    method: 'GET',
    headers: headers('application/json'),
  });

  if (response.ok) {
    var data = await response.json();
    console.log(data);

    for (let i = 0; i < data.length; i++) {
      if (i === 30) {
        break;
      }
      var title = `${data[i].title}`;

      var endsAt = `${data[i].endsAt}`;
      var endsAtFirstTen = endsAt.substring(0, 10);

      var template = document
        .querySelector('#cardAuctionSales')
        .content.cloneNode(true);

      template.querySelector('.cardTitle').innerHTML += title;
      template.querySelector(
        '.cardPicture'
      ).innerHTML = `<img class="PreviewPicture" src="${data[i].media[0]}"> </img>`;
      template.querySelector(
        '.cardDescription'
      ).innerHTML += `${data[i].description}`;
      template.querySelector(
        '.cardDescription'
      ).innerHTML += `<p class="cardDescription">bidding ends at: ${endsAtFirstTen}</p>`;
      document.querySelector('.Container').append(template);
    }
  }
}
await getInfo();
