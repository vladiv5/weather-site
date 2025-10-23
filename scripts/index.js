document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
  
    // ===== DOM Elements =====
    const autocomplete = document.getElementById("autocomplete");
    const resultsList = document.getElementById("results");
    const weatherCard = document.getElementById("weather-card");
  
    // ===== Constants & State =====
    const API_KEY = "1ed72901fef34a7da48182141250901";
    let selectedCity = "";
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    let resultsVisible = false;
  
    // ===== Event Listeners =====
  
    // Input handler pentru autocomplete
    autocomplete.addEventListener("input", () => {
      const query = autocomplete.value.trim();
      resultsList.innerHTML = "";
  
      if (query.length > 2) {
        fetchCities(query);
        resultsVisible = true;
        resultsList.classList.remove("hidden");
      } else if (query.length === 0) {
        resultsVisible = false;
        resultsList.classList.add("hidden");
      }
    });
  
    // Focus pe search bar
    autocomplete.addEventListener("focus", () => {
      if (autocomplete.value.trim().length > 2 && resultsList.children.length > 0) {
        resultsList.classList.remove("hidden");
      }
    });
  
    // Click în afara search bar-ului => ascunde lista cu sugestii
    document.addEventListener("click", (event) => {
      const isClickInsideSearch =
        autocomplete.contains(event.target) || resultsList.contains(event.target);
  
      if (!isClickInsideSearch) {
        resultsList.classList.add("hidden");
      }
    });
  
    // ===== API Fetching =====
  
    async function fetchCities(query) {
      const url = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (!Array.isArray(data) || data.length === 0) {
          resultsList.innerHTML = "<li>No cities found.</li>";
          return;
        }
  
        resultsList.innerHTML = "";
        data.forEach(city => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "center";
          li.style.padding = "8px";
          li.style.cursor = "pointer";
  
          const span = document.createElement("span");
          span.textContent = `${city.name}, ${city.region}, ${city.country}`;
  
          // Select city
          li.addEventListener("click", () => {
            autocomplete.value = city.name;
            selectedCity = city.name;
            resultsList.innerHTML = "";
            resultsList.classList.add("hidden");
            fetchWeather(city.name);
          });
  
          // Add favorite button
          const heart = document.createElement("button");
          heart.className = "heart-button";
          heart.innerHTML = "&#9829;";
          heart.addEventListener("click", (e) => {
            e.stopPropagation();
            addFavorite(city.name);
          });
  
          li.appendChild(span);
          li.appendChild(heart);
          resultsList.appendChild(li);
        });
  
        resultsList.classList.remove("hidden");
      } catch (err) {
        console.error("Error fetching cities:", err);
        resultsList.innerHTML = "<li>Failed to fetch city data.</li>";
      }
    }
  
    async function fetchWeather(city) {
      const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;
      showSpinner();
  
      try {
        const response = await fetch(url);
        const data = await response.json();
        displayWeather(data);
      } catch (err) {
        console.error("Error fetching weather data:", err);
      } finally {
        hideSpinner();
      }
    }
  
    // ===== UI Update Functions =====
  
    function displayWeather(data) {
      if (!data?.location || !data?.current) return;
  
      const { name, region, country, localtime } = data.location;
      const { temp_c, condition, humidity, wind_mph } = data.current;
  
      weatherCard.innerHTML = `
        <table>
          <tr><th>City</th><td>${name}</td></tr>
          <tr><th>Region</th><td>${region}</td></tr>
          <tr><th>Country</th><td>${country}</td></tr>
          <tr><th>Temperature</th><td>${temp_c} &deg;C</td></tr>
          <tr><th>Condition</th><td>${condition.text}</td></tr>
          <tr><th>Humidity</th><td>${humidity}%</td></tr>
          <tr><th>Wind Speed</th><td>${wind_mph} mph</td></tr>
          <tr><th>Local Time</th><td>${localtime}</td></tr>
        </table>
        <button id="forecast-button">View 5-Day Forecast</button>
      `;
  
      weatherCard.classList.remove("hidden");
  
      document.getElementById("forecast-button").addEventListener("click", () => {
        window.location.href = `city_weather.html?city=${encodeURIComponent(selectedCity)}`;
      });
    }
  
    // ===== Favorites Handling =====
  
    // Functia noua (fara displayFavorites())
    function addFavorite(city) {
      if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        // Optional: Poti adauga un alert sau o notificare
        alert(city + " was added to your favorites!");
      }
    }
  });