document.addEventListener("DOMContentLoaded", (_event) => {
    console.log("After DOM has loaded");

    const autocomplete = document.getElementById("autocomplete");
    const resultsHTML = document.getElementById("results");
    const favoritesHTML = document.getElementById("favorites");
    const weatherCard = document.getElementById("weather-card");
    const apiKey = '1ed72901fef34a7da48182141250901';
    let selectedCity = '';
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Autocomplete
    autocomplete.oninput = function () {
        const userInput = this.value;
        resultsHTML.innerHTML = "";

        if (userInput.length > 2) {
            fetchCities(userInput);
        } else if (userInput.length === 0) {
            displayFavorites();
        }
    };

    // Fucntie pentru a cauta orasele in API-ul de vreme
    function fetchCities(query) {
        const url = `http://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched cities:", data); 

                if (Array.isArray(data)) {
                    resultsHTML.innerHTML = '';

                    const filteredCities = data.filter(city => city.name.toLowerCase().startsWith(query.toLowerCase()));

                    if (filteredCities.length > 0) {
                        filteredCities.forEach(city => {
                            const listItem = document.createElement("li");
                            listItem.textContent = `${city.name}, ${city.region}, ${city.country}`;
                            listItem.dataset.cityName = city.name;
                            listItem.dataset.cityRegion = city.region;
                            listItem.dataset.cityCountry = city.country;

                            const heartButton = document.createElement("button");
                            heartButton.classList.add("heart-button");
                            heartButton.innerHTML = "&#9829;";
                            heartButton.addEventListener("click", (event) => {
                                event.stopPropagation();
                                addFavorite(city.name);
                            });

                            listItem.appendChild(heartButton);
                            listItem.addEventListener("click", () => {
                                autocomplete.value = city.name;
                                resultsHTML.innerHTML = "";
                                selectedCity = city.name;
                                fetchWeather(city.name);
                            });

                            resultsHTML.appendChild(listItem);
                        });
                        resultsHTML.style.display = 'block';
                    } else {
                        resultsHTML.innerHTML = "No cities found.";
                    }
                } else {
                    console.error("API response is not an array:", data);
                    resultsHTML.innerHTML = "No cities found.";
                }

                resultsHTML.style.display = data.length ? 'block' : 'none';
            })
            .catch(error => {
                console.error("Error fetching cities:", error);
            });
    }

    // Functie pentru API-ul de vreme si pentru a afisa spinner-ul
    function fetchWeather(city) {
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;

        showSpinner();
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched weather data:", data);
                displayWeather(data);
                hideSpinner();
            })
            .catch(error => {
                console.error("Error fetching weather data:", error);
                hideSpinner();
            });
    }

    // Functie pentru a afisa datele meteo in tabel
    function displayWeather(data) {
        if (data && data.location && data.current) {
            const weatherTable = `
                <table>
                    <tr>
                        <th>City</th>
                        <td>${data.location.name}</td>
                    </tr>
                    <tr>
                        <th>Region</th>
                        <td>${data.location.region}</td>
                    </tr>
                    <tr>
                        <th>Country</th>
                        <td>${data.location.country}</td>
                    </tr>
                    <tr>
                        <th>Temperature</th>
                        <td>${data.current.temp_c} &deg;C</td>
                    </tr>
                    <tr>
                        <th>Condition</th>
                        <td>${data.current.condition.text}</td>
                    </tr>
                    <tr>
                        <th>Humidity</th>
                        <td>${data.current.humidity}%</td>
                    </tr>
                    <tr>
                        <th>Wind Speed</th>
                        <td>${data.current.wind_mph} mph</td>
                    </tr>
                    <tr>
                        <th>Local Time</th>
                        <td>${data.location.localtime}</td>
                    </tr>
                </table>
                <button id="forecast-button">View the forecast for the next 5 days</button>
            `;

            weatherCard.innerHTML = weatherTable;
            weatherCard.classList.remove("hidden");

            const forecastButton = document.getElementById("forecast-button");
            forecastButton.addEventListener("click", () => {
                window.location.href = `city_weather.html?city=${encodeURIComponent(selectedCity)}`;
            });
        } else {
            console.error("Invalid data structure:", data);
        }
    }

    // Functie pentru a adauga un oras la lista de favorite
    function addFavorite(city) {
        if (!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            displayFavorites();
        }
    }

    // Functie pentru a afisa lista de favorite
    function displayFavorites() {
        favoritesHTML.innerHTML = '';
        favorites.forEach(city => {
            const listItem = document.createElement("li");
            listItem.textContent = city;
            listItem.addEventListener("click", () => {
                autocomplete.value = city;
                fetchWeather(city);
                window.location.href = `city_weather.html?city=${encodeURIComponent(city)}`;
            });
            favoritesHTML.appendChild(listItem);
        });
        favoritesHTML.classList.remove("hidden");
    }

    resultsHTML.onclick = function (event) {
        const setValue = event.target.innerText;
        autocomplete.value = setValue;
        this.innerHTML = "";
    };

    // Afiseaza lista de favorite cand inputul este in focus
    autocomplete.addEventListener("focus", () => {
        if (autocomplete.value === '') {
            displayFavorites();
        }
    });

    // Ascunde lista de sugestii cand se da click in afara inputului
    autocomplete.addEventListener("blur", () => {
        setTimeout(() => {
            favoritesHTML.classList.add("hidden");
        }, 200);
    });

    displayFavorites();
});