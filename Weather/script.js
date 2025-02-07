document.addEventListener('DOMContentLoaded', function() {
    // При загрузке страницы показываем погоду для Москвы
    fetchWeather('Moscow'); // Используйте английское название города

    // Функция для обновления времени в реальном времени
    function updateTime() {
        const currentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const dayName = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
        document.getElementById('dayTime').textContent = `${dayName}, ${currentTime}`;
    }

    // Запускаем обновление времени каждую секунду
    setInterval(updateTime, 1000);

    // Первичное обновление времени при загрузке страницы
    updateTime();
});

document.getElementById('weatherForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('Введите название города');
        return;
    }
    fetchWeather(city);
});

function fetchWeather(city) {
    const apiKey = 'da94e330e2900f753b68e77e040920d8'; // Замените YOUR_API_KEY на ваш API ключ
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Город не найден. Проверьте правильность названия.');
                } else if (response.status === 401) {
                    throw new Error('Неверный API ключ. Проверьте ваш API ключ.');
                } else {
                    throw new Error('Ошибка при получении данных о погоде.');
                }
            }
            return response.json();
        })
        .then(data => {
            // Основная информация
            document.getElementById('temperature').textContent = `${data.main.temp}°C`;
            document.getElementById('feelsLike').textContent = `${data.main.feels_like}°C`;
            document.getElementById('description').textContent = data.weather[0].description;

            // Локация
            document.getElementById('location').textContent = `${data.name}, ${data.sys.country}`;

            // Дополнительная информация
            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            document.getElementById('sunrise').textContent = sunrise;
            document.getElementById('sunset').textContent = sunset;
            document.getElementById('windSpeed').textContent = data.wind.speed;
            document.getElementById('cloudiness').textContent = data.clouds.all;
            document.getElementById('humidity').textContent = data.main.humidity;

            document.querySelector('.weather-container').classList.remove('hidden');

            // Получаем координаты города для запроса прогноза на неделю
            const lat = data.coord.lat;
            const lon = data.coord.lon;
            fetchForecast(lat, lon);
        })
        .catch(error => {
            alert(error.message);
        });
}

function fetchForecast(lat, lon) {
    const apiKey = 'da94e330e2900f753b68e77e040920d8'; // Замените YOUR_API_KEY на ваш API ключ
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru`;

    fetch(forecastUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении прогноза');
            }
            return response.json();
        })
        .then(data => {
            const forecastTiles = document.getElementById('forecastTiles');
            forecastTiles.innerHTML = ''; // Очищаем предыдущие плитки

            // Группируем данные по дням
            const dailyData = {};
            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0]; // Берем только дату
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(item);
            });

            // Преобразуем объект в массив и сортируем по датам
            const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));

            // Берем только первые 5 дней
            sortedDates.slice(0, 5).forEach(date => {
                const dayData = dailyData[date];
                const avgTemp = Math.round(
                    dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length
                );
                const minTemp = Math.min(...dayData.map(item => item.main.temp_min));
                const maxTemp = Math.max(...dayData.map(item => item.main.temp_max));
                const description = dayData[0].weather[0].description;
                const iconCode = dayData[0].weather[0].icon;

                const tile = document.createElement('div');
                tile.classList.add('forecast-tile');

                const dayName = new Date(dayData[0].dt * 1000).toLocaleDateString('ru-RU', { weekday: 'long' });
                const formattedDate = new Date(dayData[0].dt * 1000).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                });

                tile.innerHTML = `
                    <h4>${dayName}</h4>
                    <div class="date">${formattedDate}</div>
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}">
                    <p class="temperature">${avgTemp}°C</p>
                    <p><strong>Мин:</strong> ${Math.round(minTemp)}°C</p>
                    <p><strong>Макс:</strong> ${Math.round(maxTemp)}°C</p>
                    <p>${description}</p>
                `;

                forecastTiles.appendChild(tile);
            });

            document.getElementById('forecastContainer').classList.remove('hidden');
        })
        .catch(error => {
            console.error('Ошибка при получении прогноза:', error);
            alert('Не удалось получить прогноз погоды на неделю.');
        });
}