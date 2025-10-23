document.addEventListener("DOMContentLoaded", () => {
    
    // --- Referinte API si DOM ---
    const apiKey = '1ed72901fef34a7da48182141250901'; // Cheia ta API
    const favoritesGrid = document.getElementById("favorites-grid");
    const emptyMsg = document.getElementById("empty-favorites-msg");
    const toast = document.getElementById("toast-notification");

    // --- Functii ---

    /**
     * Incarca orasele favorite din localStorage si le afiseaza
     */
    async function loadFavorites() {
        showSpinner();
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

        if (favorites.length === 0) {
            // Afiseaza mesajul "lista goala"
            emptyMsg.classList.remove("hidden");
            hideSpinner();
            return;
        }

        // Avem favorite, ascundem mesajul
        emptyMsg.classList.add("hidden");

        // Cream o lista de "promisiuni" API
        // Apelam API-ul pentru TOATE orasele in paralel
        const weatherPromises = favorites.map(city => fetchWeather(city));

        try {
            // Asteptam ca TOATE apelurile sa se termine
            const weatherDataList = await Promise.all(weatherPromises);

            // Curatam grila inainte de a adauga elemente noi
            favoritesGrid.innerHTML = ""; 
            
            // Cream si adaugam cardurile
            weatherDataList.forEach((data, index) => {
                const originalCityName = favorites[index];

                if (data && data.location) {
                    const card = createFavoriteCard(data, originalCityName);
                    favoritesGrid.innerHTML += card;
                }
            });

            // Adaugam event listeners pentru noile butoane de stergere
            setupRemoveButtons();

        } catch (error) {
            console.error("Error fetching one or more favorites:", error);
            favoritesGrid.innerHTML = "<p>Could not load favorites data. Please try again later.</p>";
        } finally {
            hideSpinner();
        }
    }

    /**
     * Face un apel API pentru un singur oras
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
     * Construieste HTML-ul pentru un singur card
     */
    function createFavoriteCard(data, originalCityName) { // <-- Argument nou
        // Folosim datele din API pentru afisare
        const { name, country } = data.location;
        const { temp_c, condition, wind_mph, humidity } = data.current;

        // Folosim "originalCityName" (din localStorage) pentru data-atribute
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
     * Adauga event listeners (delegare) pentru butoanele de stergere
     */
    function setupRemoveButtons() {
        favoritesGrid.addEventListener('click', (e) => {
            // Verificam daca s-a dat click pe un buton de stergere
            if (e.target.classList.contains('remove-fav-card')) {
                const city = e.target.dataset.city;
                removeFavorite(city);
            }
        });
    }

    /**
     * Sterge un oras din localStorage si de pe pagina
     */
    function removeFavorite(city) {
        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        
        // Cream o lista noua fara orasul selectat
        favorites = favorites.filter(fav => fav !== city);
        
        // Salvam lista noua in localStorage
        localStorage.setItem("favorites", JSON.stringify(favorites));
        
        // Stergem cardul de pe pagina (fara refresh)
        const cardToRemove = document.querySelector(`.favorite-card[data-city="${city}"]`);
        if (cardToRemove) {
            cardToRemove.remove();
        }

        // Afiseaza notificarea de stergere
        showToast(`Removed ${city} from favorites.`);

        // Daca am sters ultimul card, afisam mesajul "lista goala"
        if (favorites.length === 0) {
            emptyMsg.classList.remove("hidden");
        }
    }

    /**
 * Functie NOUA: Adauga un singur card nou in grila,
 * apelata de evenimentul 'favoriteAdded'
 */
async function appendNewFavoriteCard(city) {
    try {
        // 1. Cere datele meteo pentru noul oras
        const data = await fetchWeather(city);

        if (data && data.location) {
            // 2. Creaza HTML-ul cardului
            // Folosim 'city' (numele original) pentru stergere
            const cardHTML = createFavoriteCard(data, city);

            // 3. Ascunde mesajul "lista goala", daca e vizibil
            emptyMsg.classList.add("hidden");

            // 4. Adauga noul card in grila
            // 'insertAdjacentHTML' e mai eficient decat 'innerHTML +='
            favoritesGrid.insertAdjacentHTML('beforeend', cardHTML);
        }
    } catch (error) {
        console.error("Failed to append new favorite card:", error);
        // Nu afisam toast, 'global_search' a facut-o deja
    } finally {

    }
}

    function showToast(message) {
        if (!toast) return; // Daca elementul toast nu exista
        
        toast.textContent = message;
        toast.classList.add("show");
        toast.classList.remove("hidden"); // Asigurare

        // Ascunde pop-up-ul dupa 3 secunde
        setTimeout(() => {
            toast.classList.remove("show");
            // Adaugam un mic delay pt tranzitia de "fade-out"
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 300); // Trebuie sa fie la fel ca tranzitia CSS
        }, 3000);
    }

    /**
 * Asculta evenimentul global 'favoriteAdded' trimis de
 * global_search.js si adauga noul card pe pagina.
 */
document.addEventListener('favoriteAdded', (e) => {
    const newCity = e.detail.city;
    appendNewFavoriteCard(newCity);
});

    // --- Initializare ---
    loadFavorites();
});