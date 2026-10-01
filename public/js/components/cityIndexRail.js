// public/js/components/cityIndexRail.js
// Left margin CityIndexRail in --font-mono, underline on active city

export function renderCityIndexRail(cities = [], selectedCity = 'All', onSelectCity) {
  const nav = document.createElement('aside');
  nav.className = 'city-index-rail';

  const title = document.createElement('div');
  title.className = 'rail-title';
  title.textContent = 'City Index';
  nav.appendChild(title);

  const list = document.createElement('ul');
  list.className = 'rail-list';

  const allItem = document.createElement('li');
  allItem.className = 'rail-item';
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.textContent = 'All Cities';
  if (selectedCity === 'All') allBtn.classList.add('active');
  allBtn.addEventListener('click', () => onSelectCity('All'));
  allItem.appendChild(allBtn);
  list.appendChild(allItem);

  cities.forEach(city => {
    const item = document.createElement('li');
    item.className = 'rail-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = city;
    if (selectedCity.toLowerCase() === city.toLowerCase()) btn.classList.add('active');
    btn.addEventListener('click', () => onSelectCity(city));
    item.appendChild(btn);
    list.appendChild(item);
  });

  nav.appendChild(list);
  return nav;
}
