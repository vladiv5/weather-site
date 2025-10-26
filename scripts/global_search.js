document.addEventListener("DOMContentLoaded", () => {
    // --- Elemente DOM & Constante ---
    const autocomplete = document.getElementById("autocomplete");
    const resultsList = document.getElementById("results");
    const toast = document.getElementById("toast-notification");
    const getLocationBtn = document.getElementById("get-location-btn");

    const API_KEY = "1ed72901fef34a7da48182141250901"; // Cheia ta
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    let toastTimer;

    // --- Event Listeners pentru Autocomplete ---

    // Input handler
    autocomplete.addEventListener("input", () => {
        const query = autocomplete.value.trim();
        resultsList.innerHTML = "";

        if (query.length > 2) {
            fetchCities(query);
            resultsList.classList.remove("hidden");
        } else {
            resultsList.classList.add("hidden");
        }
    });

    // Focus pe search bar
    autocomplete.addEventListener("focus", () => {
        if (autocomplete.value.trim().length > 2 && resultsList.children.length > 0) {
            resultsList.classList.remove("hidden");
        }
    });

    // Click in afara search bar-ului
    document.addEventListener("click", (event) => {
        const isClickInsideSearch =
            autocomplete.contains(event.target) || resultsList.contains(event.target);
        if (!isClickInsideSearch) {
            resultsList.classList.add("hidden");
        }
    });

    /**
     * Asculta evenimentul global 'favoriteRemoved' trimis de
     * favorites.js si actualizeaza lista interna 'favorites'.
     */
    document.addEventListener('favoriteRemoved', (e) => {
        const removedCity = e.detail.city;
        // Filtreaza lista interna 'favorites' pentru a elimina orasul
        favorites = favorites.filter(fav => fav !== removedCity);
        console.log('Internal favorites updated after removal:', favorites); // Optional: pentru debugging
    });

    getLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showSpinner(); // Afiseaza spinner cat timp asteptam
        navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, {
            enableHighAccuracy: true, // Incearca sa obtina o locatie mai precisa
            timeout: 10000,         // Timp maxim de asteptare (10 secunde)
            maximumAge: 0           // Forteaza obtinerea unei locatii proaspete
        });
    } else {
        showToast("Geolocation is not supported by this browser.");
    }
});

    // --- Functii API & Favorite ---

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

                // --- Am sters stilurile inline, le-am mutat in CSS ---

                const uniqueName = `${city.name}, ${city.country}`;
                const span = document.createElement("span");
                span.textContent = uniqueName;

                li.addEventListener("click", () => {
                    window.location.href = `city_weather.html?city=${encodeURIComponent(city.name)}`;
                });

                // Butonul de adaugare la favorite
                const heart = document.createElement("button");
                heart.className = "heart-button";
                heart.innerHTML = "&#9829;";
                heart.addEventListener("click", (e) => {
                    e.stopPropagation(); // Opreste redirectarea
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

    // --- MODIFICARE ---
    // Functia adFavorite acum foloseste noul pop-up (toast)
    function addFavorite(city) {
        if (!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem("favorites", JSON.stringify(favorites));

            // Afiseaza pop-up-ul
            showToast(`Added ${city} to favorites!`);

            // Anunta restul aplicatiei (in special pagina de favorite)
            const event = new CustomEvent('favoriteAdded', { detail: { city: city } });
            document.dispatchEvent(event);

        } else {
            showToast(`${city} is already in your favorites.`);
        }
    }

    // Functia pentru a afisa pop-up-ul
    function showToast(message) {
        if (!toast) return; // Daca elementul toast nu exista

        clearTimeout(toastTimer); // Reseteaza timer-ul daca exista unul activ

        toast.textContent = message;
        toast.classList.add("show");
        toast.classList.remove("hidden"); // Asigurare

        // Ascunde pop-up-ul dupa 3 secunde
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
            // Adaugam un mic delay pt tranzitia de "fade-out"
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 300); // Trebuie sa fie la fel ca tranzitia CSS
        }, 3000);
    }
    
    /**
     * Callback apelat cand geolocatia reuseste.
     * Redirectioneaza catre pagina meteo folosind coordonatele.
     */
    function geolocationSuccess(position) {
        hideSpinner(); // Ascunde spinner-ul
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Formateaza coordonatele pentru API (lat,lon)
        const query = `${lat},${lon}`;

        // Redirectioneaza catre pagina meteo
        window.location.href = `city_weather.html?city=${encodeURIComponent(query)}`;
    }

    /**
     * Callback apelat cand geolocatia esueaza sau este refuzata.
     */
    function geolocationError(error) {
        hideSpinner(); // Ascunde spinner-ul
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
        showToast(message); // Afiseaza eroarea utilizatorului
    }

});

