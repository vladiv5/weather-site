document.addEventListener("DOMContentLoaded", () => {
    // --- Elemente DOM & Constante ---
    const autocomplete = document.getElementById("autocomplete");
    const resultsList = document.getElementById("results");
    const toast = document.getElementById("toast-notification");

    const API_KEY = "1ed72901fef34a7da48182141250901"; // Cheia ta
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

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

                const span = document.createElement("span");
                span.textContent = `${city.name}, ${city.region}, ${city.country}`;

                // --- MODIFICARE ---
                // Acum, un click pe un oras REDIRECTIONEAZA
                li.addEventListener("click", () => {
                    window.location.href = `city_weather.html?city=${encodeURIComponent(city.name)}`;
                });

                // Butonul de adaugare la favorite
                const heart = document.createElement("button");
                heart.className = "heart-button";
                heart.innerHTML = "&#9829;";
                heart.addEventListener("click", (e) => {
                    e.stopPropagation(); // Opreste redirectarea
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

    // --- MODIFICARE ---
    // Functia adFavorite acum foloseste noul pop-up (toast)
    function addFavorite(city) {
        if (!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem("favorites", JSON.stringify(favorites));

            // Afiseaza pop-up-ul
            showToast(`Added ${city} to favorites!`);
        } else {
            showToast(`${city} is already in your favorites.`);
        }
    }

    // --- FUNCTIE NOUA ---
    // Functia pentru a afisa pop-up-ul
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
});