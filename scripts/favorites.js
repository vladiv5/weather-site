document.addEventListener("DOMContentLoaded", () => {
    
    // --- API and DOM References ---
    const apiKey = '1ed72901fef34a7da48182141250901';
    const favoritesGrid = document.getElementById("favorites-grid");
    const emptyMsg = document.getElementById("empty-favorites-msg");
    const toast = document.getElementById("toast-notification");

    let toastTimer;

    // --- Functions ---

    /**
     * I load favorite cities from LocalStorage and display them.
     */
    async function loadFavorites() {
        showSpinner();
        // I parse the favorites array, defaulting to empty if not found.
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

        if (favorites.length === 0) {
            // I show a user-friendly message if the list is empty.
            emptyMsg.classList.remove("hidden");
            hideSpinner();
            return;
        }

        emptyMsg.classList.add("hidden");

        // I create an array of promises to fetch weather data for ALL cities in parallel.
        // This is much faster than fetching them sequentially.
        const weatherPromises = favorites.map(city => fetchWeather(city));

        try {
            // I wait for all API calls to complete.
            const weatherDataList = await Promise.all(weatherPromises);

            // I clear the grid before rendering fresh data.
            favoritesGrid.innerHTML = ""; 
            
            weatherDataList.forEach((data, index) => {
                const originalCityName = favorites[index];

                if (data && data.location) {
                    const card = createFavoriteCard(data, originalCityName);
                    favoritesGrid.innerHTML += card;
                }
            });
        } catch (error) {
            console.error("Error fetching one or more favorites:", error);
            favoritesGrid.innerHTML = "<p>Could not load favorites data. Please try again later.</p>";
        } finally {
            hideSpinner();
        }
    }

    /**
     * I fetch current weather data for a single city.
     */
    function fetchWeather(city) {
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
        return fetch(url).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok for city: ' + city);
            }
            return response.json();
        });
    }

    /**
     * I generate the HTML for a single favorite card.
     */
    function createFavoriteCard(data, originalCityName) { 
        // I destructure the API response for cleaner code.
        const { name, country } = data.location;
        const { temp_c, condition, wind_mph, humidity } = data.current;

        // I store 'originalCityName' in a data attribute to use it later for deletion.
        return `
            <li class="grid-item favorite-card" data-city="${originalCityName}">
                <div class="status">
                    <button class="remove-fav-card" data-city="${originalCityName}">&times;</button>
                    <p class="cardtitle">${name}</p>
                    <p class="subtext"><strong>${country}</strong></p>
                    <p class="subtext"><strong>Temp:</strong> ${temp_c} &deg;C</p>
                    <p class="subtext"><strong>Condition:</strong> ${condition.text}</p>
                    <p class="subtext"><strong>Wind:</strong> ${wind_mph} mph</p>
                    <p class="subtext"><strong>Humidity:</strong> ${humidity} %</p>
                </div>
            </li>
        `;
    }

    /**
     * I use event delegation to handle clicks on remove buttons efficiently.
     */
    function setupRemoveButtons() {
        favoritesGrid.addEventListener('click', (e) => {
            // I check if the clicked element is a remove button.
            if (e.target.classList.contains('remove-fav-card')) {
                const city = e.target.dataset.city;
                removeFavorite(city);
            }
        });
    }

    /**
     * I remove a city from both LocalStorage and the DOM.
     */
    function removeFavorite(city) {
        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        const updatedFavorites = favorites.filter(fav => fav !== city);
        
        // I update LocalStorage.
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
        
        // I remove the DOM element immediately without reloading the page.
        const cardToRemove = document.querySelector(`.favorite-card[data-city="${city}"]`);
        if (cardToRemove) {
            cardToRemove.remove();
        }

        showToast(`Removed ${city} from favorites.`);

        // I dispatch a custom event to notify other parts of the app (like search bar state).
        const event = new CustomEvent('favoriteRemoved', { detail: { city: city } });
        document.dispatchEvent(event);

        if (favorites.length === 0) {
            emptyMsg.classList.remove("hidden");
        }
    }

    /**
     * I dynamically append a new card when the user adds a favorite from the search bar.
     */
    async function appendNewFavoriteCard(city) {
        try {
            const data = await fetchWeather(city);

            if (data && data.location) {
                const cardHTML = createFavoriteCard(data, city);

                emptyMsg.classList.add("hidden");

                // I insert the new HTML at the end of the grid.
                favoritesGrid.insertAdjacentHTML('beforeend', cardHTML);
            }
        } catch (error) {
            console.error("Failed to append new favorite card:", error);
        } finally {

        }
    }

    function showToast(message) {
        if (!toast) return;

        clearTimeout(toastTimer);
        
        toast.textContent = message;
        toast.classList.remove("hidden");
        toast.classList.remove("show");

        // I use a small timeout to allow the browser to register the state change before animating.
        setTimeout(() => {
            toast.classList.add("show");
        }, 10); 

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 300); // Matches CSS transition duration.
        }, 3000);
    }

    /**
     * I listen for the 'favoriteAdded' event triggered by the global search component.
     */
    document.addEventListener('favoriteAdded', (e) => {
        const newCity = e.detail.city;
        appendNewFavoriteCard(newCity);
    });

    // --- Initialization ---
    setupRemoveButtons();
    loadFavorites();
});