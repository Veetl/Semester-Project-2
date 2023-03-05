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

var profile = load('profile');
if (profile != null) {
  var profileURL = profile.avatar;
  document.querySelector('.image').src = `${profileURL}`;
  document.querySelector('.image').addEventListener('error', (e) => {
    e.target.src = 'https://fomantic-ui.com/images/wireframe/image.png';
  });

  document.querySelector('#welcometext').innerText = `${profile.name}`;
  document.querySelector('#credits').innerText = `credits: ${profile.credits}`;
  document.querySelector('#loginForm').innerText = '';
  document.querySelector('#register').innerText = '';
  document.querySelector('#hamburger').style.display = 'block';
} else {
  document
    .querySelector('form#registerForm')
    .addEventListener('submit', registerListener);
  document.querySelector('.image').hidden = true;
  document.querySelector('#logout').hidden = true;
  document.querySelector('#profile').style.display = 'none';
  document.querySelector('#create').style.display = 'none';
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

document.getElementById('profile').addEventListener('click', viewProfile);

export function viewProfile() {
  var profile = load('profile');
  document.querySelector('.Container').innerText = '';
  var template = document.querySelector('#profilePage').content.cloneNode(true);
  template.querySelector('.profileImage').src = `${profile.avatar}`;

  template
    .querySelector('form')
    .addEventListener('submit', changeAvatarListener);

  document.querySelector('.Container').append(template);
}

export async function changeAvatarListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const avatar = data.get('AvatarURL');

  const response = await fetch(
    `${apiPath}/auction/profiles/${profile.name}/media`,
    {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
      headers: headers('application/json'),
    }
  );

  if (response.ok) {
    profile.avatar = avatar;
    save('profile', profile);
    location.reload();
  }
  throw new Error(response.statusText);
}

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

document.getElementById('create').addEventListener('click', createListing);

export async function createListing() {
  document.querySelector('.Container').innerText = '';

  var template = document
    .querySelector('#createListingPage')
    .content.cloneNode(true);

  template.querySelector('form').addEventListener('submit', createListener);
  document.querySelector('.Container').append(template);
}

export async function createListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const title = data.get('title');
  const description = data.get('description');
  const endsAt = new Date(data.get('endsAt')).toISOString();
  const tags = data
    .get('tags')
    .split(',')
    .map((x) => x.trim());
  const media = data
    .get('media')
    .split(',')
    .map((x) => x.trim());

  const response = await fetch(`${apiPath}/auction/listings`, {
    method: 'POST',
    body: JSON.stringify({ title, description, endsAt, tags, media }),
    headers: headers('application/json'),
  });
  if (response.ok) {
    location.reload();
  }
  throw new Error(response.statusText);
}

document
  .querySelector('form#loginForm')
  .addEventListener('submit', loginListener);

export async function seachbarListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const keyword = data.get('keywords');
  getInfo(keyword);
}

document
  .querySelector('form#searchbarform')
  .addEventListener('submit', seachbarListener);

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

export async function submitBidListener(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const id = data.get('hidden');
  const amount = Number(data.get('amount'));

  const response = await fetch(`${apiPath}/auction/listings/${id}/bids`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
    headers: headers('application/json'),
  });
  if (response.ok) {
    location.reload();
  }
  var data2 = await response.json();
  console.log(data2);
  for (var i = 0; i < data2.errors.length; i++) {
    alert(data2.errors[i].message);
  }
  throw new Error(response.statusText);
}
var tab = 0;
function goLeft() {
  if (tab <= 0) {
    return;
  }
  tab = tab - 1;
  var pictures = document.querySelectorAll('.detailsPicture');
  for (var i = 0; i < pictures.length; i++) {
    pictures[i].hidden = true;
  }
  pictures[tab].hidden = false;
}
function goRight() {
  var pictures = document.querySelectorAll('.detailsPicture');
  if (tab >= pictures.length - 1) {
    return;
  }
  tab = tab + 1;
  for (var i = 0; i < pictures.length; i++) {
    pictures[i].hidden = true;
  }
  pictures[tab].hidden = false;
}

export async function detailsListener(anything) {
  var itemdata = anything.currentTarget.getAttribute('data-id');
  const response = await fetch(
    `${apiPath}/auction/listings/${itemdata}?_seller=true&_bids=true`,
    {
      method: 'GET',
      headers: headers('application/json'),
    }
  );
  if (response.ok) {
    var data = await response.json();
    console.log(data);
    document.querySelector('.Container').innerText = '';

    var template = document
      .querySelector('#detailsPage')
      .content.cloneNode(true);
    template.querySelector('.detailTitle').innerText = data.title;
    if (data.title === '') {
      template.querySelector('.detailTitle').innerText = 'Missing Title';
    }
    template.querySelector('.detailDescription').innerText = data.description;
    if (data.description === '') {
      template.querySelector('.detailDescription').innerText =
        'Missing Description';
    }

    tab = 0;
    for (let i = 0; i < data.media.length; i++) {
      var template1 = document
        .querySelector('#picturetemplate')
        .content.cloneNode(true);
      template1
        .querySelector('.detailsPicture')
        .addEventListener('error', (e) => {
          e.target.src = 'https://fomantic-ui.com/images/wireframe/image.png';
        });
      template1.querySelector('.detailsPicture').src = data.media[i];
      template1.querySelector('.detailsPicture').id = `image${i}`;
      if (i > 0) template1.querySelector('.detailsPicture').hidden = true;
      template.querySelector('#imagecontainer').append(template1);
    }

    if (data.media.length == 0) {
      var template2 = document
        .querySelector('#picturetemplate')
        .content.cloneNode(true);
      template2.querySelector('.detailsPicture').src =
        'https://fomantic-ui.com/images/wireframe/image.png';
      template.querySelector('#imagecontainer').append(template2);
    }

    data.bids.sort((a, b) => b.amount - a.amount);

    for (let i = 0; i < data.bids.length; i++) {
      var template3 = document
        .querySelector('#biddingDetails')
        .content.cloneNode(true);

      var name_bidder = `${data.bids[i].bidderName}: ${data.bids[i].amount}`;

      template3.querySelector('.bid-results').innerText = name_bidder;

      template.querySelector('#bidHistory').append(template3);
    }

    template.querySelector('.right').addEventListener('click', goRight);
    template.querySelector('.left').addEventListener('click', goLeft);
    template.querySelector('#hidden').value = `${data.id}`;
    template
      .querySelector('form')
      .addEventListener('submit', submitBidListener);
    document.querySelector('.Container').append(template);
  }
}

export async function getInfo(anything) {
  const response = await fetch(
    `${apiPath}/auction/listings?sort=endsAt&sortOrder=desc&_tag=${anything}`,
    {
      method: 'GET',
      headers: headers('application/json'),
    }
  );

  if (response.ok) {
    var data = await response.json();
    console.log(data);
    document.querySelector('.Container').innerText = '';

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

      template.querySelector('.cardTitle').innerText = title;
      if (title === '') {
        template.querySelector('.cardTitle').innerText = 'Missing Title';
      }

      template.querySelector('.cardPicture').src = `${data[i].media[0]}`;
      template.querySelector('.cardPicture').addEventListener('error', (e) => {
        e.target.src = 'https://fomantic-ui.com/images/wireframe/image.png';
      });

      template.querySelector(
        '.cardDescription'
      ).innerText += `${data[i].description}`;
      if (`${data[i].description}` === '') {
        template.querySelector('.cardDescription').innerText =
          'Missing Description';
      }

      template.querySelector('.endsAt-date').innerText += `${endsAtFirstTen}`;
      template.querySelector('.cardBids').innerText += `${data[i]._count.bids}`;

      template
        .querySelector('.card-header')
        .setAttribute('data-id', data[i].id);
      template
        .querySelector('.card-header')
        .addEventListener('click', detailsListener);

      document.querySelector('.Container').append(template);
    }
  }
}
await getInfo('');

//temp0[0]._count.bids
