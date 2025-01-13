document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    const pexelsApiKey = 'wyj6VC2CBQIWPciaWM5rU3aD5PI0IOFiADXB075GuZrd0lKG3sUvUalh';
    const forecastCard = document.getElementById("forecast-card");
    const currentWeatherCard = document.getElementById("current-weather-card");

    function getCityFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('city');
    }

    // Functie pentru a extrage prognoza meteo pentru un oras si a afisa spinner-ul
    function fetchForecast(city) {
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5`;

        showSpinner();
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched forecast data:", data);
                displayForecast(data);
                displayCurrentWeather(data);
                fetchCityPhoto(city);
                hideSpinner();
            })
            .catch(error => {
                console.error("Error fetching forecast data:", error);
                hideSpinner();
            });
    }

    // Functie pentru a extrage o fotografie a orasului
    function fetchCityPhoto(city) {
        const url = `https://api.pexels.com/v1/search?query=${city}&per_page=1`;

        fetch(url, {
            headers: {
                Authorization: pexelsApiKey
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.photos && data.photos.length > 0) {
                    const photoUrl = data.photos[0].src.original;
                    document.body.style.backgroundImage = `url(${photoUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                } else {
                    console.error("No photos found for the city:", city);
                }
            })
            .catch(error => console.error("Error fetching city photo:", error));
    }

    // Functie pentru a afisa prognoza meteo
    function displayForecast(data) {
        if (data && data.forecast && data.forecast.forecastday) {
            let forecastTable = `
                <table>
                    <tr>
                        <th>Date</th>
                        <th>Condition</th>
                        <th>Max Temp (°C)</th>
                        <th>Min Temp (°C)</th>
                        <th>Humidity (%)</th>
                        <th>Wind Speed (mph)</th>
                    </tr>
            `;

            data.forecast.forecastday.forEach(day => {
                forecastTable += `
                    <tr>
                        <td>${day.date}</td>
                        <td>${day.day.condition.text}</td>
                        <td>${day.day.maxtemp_c}</td>
                        <td>${day.day.mintemp_c}</td>
                        <td>${day.day.avghumidity}</td>
                        <td>${day.day.maxwind_mph}</td>
                    </tr>
                `;
            });

            forecastTable += `</table>`;

            forecastCard.innerHTML = forecastTable;
            forecastCard.classList.remove("hidden");
        } else {
            console.error("Invalid data structure:", data);
        }
    }

    // Functie pentru a determina animatia in functie de vreme
    function getWeatherAnimationClass(data) {
        const hour = new Date(data.last_updated).getHours();
        console.log('hour:', hour, 'localtime:', data.localtime);
        if (hour >= 18 || hour < 6) {
            return 'night';
        } else if (data.condition.text.toLowerCase().includes('rain') || data.condition.text.toLowerCase().includes('cloudy')) {
            return 'rain';
        } else if (data.condition.text.toLowerCase().includes('snow')) {
            return 'snow';
        } else if (data.condition.text.toLowerCase().includes('storm') || data.condition.text.toLowerCase().includes('thunder') || data.condition.text.toLowerCase().includes('heavy')) {
            return 'storm';
        } else if (data.condition.text.toLowerCase().includes('sunny') || data.condition.text.toLowerCase().includes('clear')) {
            return 'sunny';
        } else {
            return '';
        }
    }

    // Functie pentru a afisa datele meteo curente
    function displayCurrentWeather(data) {
        if (data && data.current && data.location) {
            const weatherAnimationClass = getWeatherAnimationClass(data.current);
            const currentWeather = `
                <div class="card card-${weatherAnimationClass}">
                    <div class="${weatherAnimationClass} city-weather-animation"></div>
                    <div class="status">
                        <p class="cardtitle">${data.location.name} - ${data.current.condition.text}</p>
                        <p class="subtext">Local Time: ${data.location.localtime}</p>
                    </div>
                </div>
            `;

            currentWeatherCard.innerHTML = currentWeather;
            currentWeatherCard.classList.remove("hidden");
        } else {
            console.error("Invalid data structure:", data);
        }
    }
    
    const city = getCityFromUrl();
    if (city) {
        fetchForecast(city);
    } else {
        console.error("No city specified in URL parameters");
    }
});