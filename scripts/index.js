document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
  
    // ===== DOM Elements =====
    const autocomplete = document.getElementById("autocomplete");
    const resultsList = document.getElementById("results");
    const favoritesList = document.getElementById("favorites");
    const weatherCard = document.getElementById("weather-card");
  
    // ===== Constants & State =====
    const API_KEY = "1ed72901fef34a7da48182141250901";
    let selectedCity = "";
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  
    // ===== Event Listeners =====
  
    // Autocomplete input handler
    autocomplete.addEventListener("input", () => {
      const query = autocomplete.value.trim();
      resultsList.innerHTML = "";
  
      if (query.length > 2) {
        fetchCities(query);
      } else if (query.length === 0) {
        displayFavorites();
      }
    });
  
    // Show favorites when input focused
    autocomplete.addEventListener("focus", () => {
      if (autocomplete.value === "") displayFavorites();
    });
  
    // Hide dropdowns on blur (with delay to allow clicks)
    autocomplete.addEventListener("blur", () => {
      setTimeout(() => favoritesList.classList.add("hidden"), 200);
    });
  
    // ===== API Fetching =====
  
    // Fetch city autocomplete results
    async function fetchCities(query) {
      const url = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (!Array.isArray(data)) {
          resultsList.innerHTML = "<li>No cities found.</li>";
          return;
        }
  
        const filtered = data.filter(city =>
          city.name.toLowerCase().startsWith(query.toLowerCase())
        );
  
        if (filtered.length === 0) {
          resultsList.innerHTML = "<li>No cities found.</li>";
          return;
        }
  
        resultsList.innerHTML = "";
        filtered.forEach(city => {
          const li = document.createElement("li");
          li.textContent = `${city.name}, ${city.region}, ${city.country}`;
  
          // Add favorite button
          const heart = document.createElement("button");
          heart.className = "heart-button";
          heart.innerHTML = "&#9829;";
          heart.addEventListener("click", e => {
            e.stopPropagation();
            addFavorite(city.name);
          });
  
          // Select city
          li.addEventListener("click", () => {
            autocomplete.value = city.name;
            selectedCity = city.name;
            resultsList.innerHTML = "";
            fetchWeather(city.name);
          });
  
          li.appendChild(heart);
          resultsList.appendChild(li);
        });
  
        resultsList.style.display = "block";
      } catch (err) {
        console.error("Error fetching cities:", err);
        resultsList.innerHTML = "<li>Failed to fetch city data.</li>";
      }
    }
  
    // Fetch weather data for a city
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
      if (!data?.location || !data?.current) {
        console.error("Invalid weather data:", data);
        return;
      }
  
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
  
    function addFavorite(city) {
      if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        displayFavorites();
      }
    }
  
    function displayFavorites() {
        favoritesList.innerHTML = "";
      
        favorites.forEach(city => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "center";
          li.style.padding = "8px";
          li.style.cursor = "pointer"; // cursor indică clickabil
      
          // Click pe întreaga li pentru a merge pe pagina orașului
          li.addEventListener("click", () => {
            window.location.href = `city_weather.html?city=${encodeURIComponent(city)}`;
          });
      
          // Textul orașului
          const span = document.createElement("span");
          span.textContent = city;
      
          // Buton × pentru ștergere
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "×";
          removeBtn.className = "remove-fav";
          removeBtn.style.marginLeft = "10px";
      
          // Click pe ×: șterge orașul și oprește propagarea
          removeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // **foarte important**
            removeFavorite(city);
          });
      
          li.appendChild(span);
          li.appendChild(removeBtn);
          favoritesList.appendChild(li);
        });
      
        favoritesList.classList.remove("hidden");
      }
      
      // Funcția de ștergere
      function removeFavorite(city) {
        favorites = favorites.filter(fav => fav !== city);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        displayFavorites();
      }
      
      
      
  
    // ===== Initialization =====
    displayFavorites();
  });
  