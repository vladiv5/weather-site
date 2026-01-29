document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements & Constants ---
    const autocomplete = document.getElementById("autocomplete");
    const resultsList = document.getElementById("results");
    const toast = document.getElementById("toast-notification");
    const getLocationBtn = document.getElementById("get-location-btn");

    const API_KEY = "1ed72901fef34a7da48182141250901"; 
    // I initialize the internal favorites cache from LocalStorage.
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    let toastTimer;

    // --- Autocomplete Event Listeners ---

    // I handle user input to fetch city suggestions.
    autocomplete.addEventListener("input", () => {
        const query = autocomplete.value.trim();
        resultsList.innerHTML = "";

        // I only trigger a search if the user types more than 2 characters to save API calls.
        if (query.length > 2) {
            fetchCities(query);
            resultsList.classList.remove("hidden");
        } else {
            resultsList.classList.add("hidden");
        }
    });

    // I show results again if the user focuses back on the input.
    autocomplete.addEventListener("focus", () => {
        if (autocomplete.value.trim().length > 2 && resultsList.children.length > 0) {
            resultsList.classList.remove("hidden");
        }
    });

    // I hide the dropdown when clicking outside the search component.
    document.addEventListener("click", (event) => {
        const isClickInsideSearch =
            autocomplete.contains(event.target) || resultsList.contains(event.target);
        if (!isClickInsideSearch) {
            resultsList.classList.add("hidden");
        }
    });

    /**
     * I listen for 'favoriteRemoved' to keep my internal cache in sync.
     */
    document.addEventListener('favoriteRemoved', (e) => {
        const removedCity = e.detail.city;
        favorites = favorites.filter(fav => fav !== removedCity);
        console.log('Internal favorites updated after removal:', favorites);
    });

    // Geolocation handler
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            showSpinner(); 
            navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, {
                enableHighAccuracy: true,
                timeout: 10000,         
                maximumAge: 0           
            });
        } else {
            showToast("Geolocation is not supported by this browser.");
        }
    });

    // --- API Functions ---

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

                const uniqueName = `${city.name}, ${city.country}`;
                const span = document.createElement("span");
                span.textContent = uniqueName;

                // Navigation logic
                li.addEventListener("click", () => {
                    window.location.href = `city_weather.html?city=${encodeURIComponent(city.name)}`;
                });

                // Favorite button logic
                const heart = document.createElement("button");
                heart.className = "heart-button";
                heart.innerHTML = "&#9829;";
                heart.addEventListener("click", (e) => {
                    e.stopPropagation(); // I prevent the click from triggering navigation.
                    addFavorite(uniqueName);
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

    function addFavorite(city) {
        // I prevent duplicates.
        if (!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem("favorites", JSON.stringify(favorites));

            showToast(`Added ${city} to favorites!`);

            // I broadcast an event so the Favorites page can update in real-time.
            const event = new CustomEvent('favoriteAdded', { detail: { city: city } });
            document.dispatchEvent(event);

        } else {
            showToast(`${city} is already in your favorites.`);
        }
    }

    function showToast(message) {
        if (!toast) return;

        clearTimeout(toastTimer);

        toast.textContent = message;
        toast.classList.add("show");
        toast.classList.remove("hidden");

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 300);
        }, 3000);
    }
    
    /**
     * I handle successful geolocation by redirecting to the weather page with coordinates.
     */
    function geolocationSuccess(position) {
        hideSpinner(); 
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const query = `${lat},${lon}`;

        window.location.href = `city_weather.html?city=${encodeURIComponent(query)}`;
    }

    function geolocationError(error) {
        hideSpinner();
        console.error("Geolocation error:", error);
        let message = "Could not get your location.";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "Geolocation permission denied. Please enable it in your browser settings.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                message = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                message = "An unknown error occurred while getting location.";
                break;
        }
        showToast(message);
    }

});