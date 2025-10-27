document.addEventListener("DOMContentLoaded", (_event) => {
    const cityLists = {
    night: ['Tokyo', 'Sydney', 'Beijing', 'Honolulu', 'Auckland'], // Orase probabil noaptea cand e zi in Europa
    rain: ['London', 'Seattle', 'Bergen', 'Vancouver', 'Dublin'],   // Orase cunoscute pentru ploaie
    snow: ['Moscow', 'Anchorage', 'Oslo', 'Helsinki', 'Reykjavik'], // Orase nordice/reci
    storm: ['Manila', 'Miami', 'Kolkata', 'Singapore', 'Mumbai'], // Orase tropicale/predispuse la furtuni
    sunny: ['Cairo', 'Dubai', 'Los Angeles', 'Athens', 'Lisbon']  // Orase predominant insorite
    };

    // Referinte catre elementele .status
    const cardStatusElements = {
    night: document.querySelector('.card-night').nextElementSibling,
    rain: document.querySelector('.card-rain').nextElementSibling,
    snow: document.querySelector('.card-snow').nextElementSibling,
    storm: document.querySelector('.card-storm').nextElementSibling,
    sunny: document.querySelector('.card-sunny').nextElementSibling
    };

    // Functie principala: Itereaza prin tipurile de vreme si cauta un oras potrivit.
    async function populateWeatherCards() {
    // Extrag tipul de card
    const weatherTypes = Object.keys(cityLists); 

    // Procesez fiecare tip de vreme
    for (const type of weatherTypes) {
        console.log(`Searching for a city with weather type: ${type}`);
        let foundCityData = null; // Variabila pentru a stoca datele orasului gasit

        // Itereaza prin lista de orase specifica tipului curent
        for (const city of cityLists[type]) {
            try {
                const weatherData = await fetchWeather(city); // Cere vremea pentru oras

                // Verifica daca vremea reala corespunde tipului cautat
                if (weatherData && checkCondition(weatherData, type)) {
                    console.log(`Found matching city for ${type}: ${city}`);
                    foundCityData = weatherData; // Am gasit un oras potrivit
                    break; // Opreste cautarea pentru acest tip de vreme
                } else {
                    console.log(`City ${city} does not match type ${type}. Trying next...`);
                }
            } catch (error) {
                console.error(`Error fetching weather for ${city}:`, error);
                // Continua cu urmatorul oras in caz de eroare
            }
        }

        // Actualizeaza cardul corespunzator (fie cu datele gasite, fie cu "Not Found")
        updateCard(type, foundCityData);
    }
}

// Functie generica pentru a cere vremea unui oras.
function fetchWeather(city) {
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
    // Adaugam timeout pentru a preveni blocarea daca un API call dureaza prea mult
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout 8 secunde

    return fetch(url, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId); // Anuleaza timeout-ul daca raspunsul vine la timp
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${city}`);
            }
            return response.json();
        })
        .catch(error => {
            clearTimeout(timeoutId); // Anuleaza timeout-ul si in caz de eroare
            if (error.name === 'AbortError') {
                console.error(`Fetch aborted for ${city} (timeout)`);
            } else {
                console.error(`Fetch error for ${city}:`, error);
            }
            return null; // Returneaza null in caz de eroare pentru a continua procesul
        });
}

// Verifica daca datele meteo de la API corespund tipului de vreme cautat.
function checkCondition(data, type) {
    if (!data || !data.current || !data.location) return false;

    const conditionText = data.current.condition.text.toLowerCase();
    const localTime = data.location.localtime;
    const hour = new Date(localTime).getHours();

    switch (type) {
        case 'night':
            // Consideram noapte intre 6 PM si 6 AM
            return hour >= 18 || hour < 6;
        case 'rain':
            return conditionText.includes('rain') || conditionText.includes('drizzle');
        case 'snow':
            return conditionText.includes('snow') || conditionText.includes('sleet') || conditionText.includes('ice pellets');
        case 'storm':
            // Conditii mai specifice pentru furtuna
            return conditionText.includes('thunder') || conditionText.includes('storm') || conditionText.includes('heavy rain');
        case 'sunny':
            // Soare doar daca NU e noapte
            return (conditionText.includes('sunny') || conditionText.includes('clear')) && !(hour >= 18 || hour < 6);
        default:
            return false;
    }
}

// Functie generica pentru a actualiza continutul unui card.
function updateCard(type, data) {
    const cardElement = cardStatusElements[type]; // Gaseste elementul .status corect
    if (!cardElement) {
        console.error(`Card element for type ${type} not found.`);
        return;
    }

    if (data && data.location && data.current) {
        // Afiseaza datele meteo gasite
        cardElement.innerHTML = `
            <p class="cardtitle">${data.current.temp_c}&deg;C</p>
            <p class="subtext">${data.location.name} - ${data.current.condition.text}</p>
            <p class="subtext">Local Time: ${data.location.localtime.split(' ')[1]}</p> `;
        // Adauga link catre pagina de prognoza
        const gridItem = cardElement.closest('.grid-item'); // Gaseste elementul <li> parinte
         if (gridItem) {
            gridItem.style.cursor = 'pointer'; // Arata ca e clickabil
            gridItem.onclick = () => {
                window.location.href = `city_weather.html?city=${encodeURIComponent(data.location.name)}`;
            };
        }

    } else {
        // Afiseaza mesajul "Not Found"
        cardElement.innerHTML = `
            <p class="cardtitle">?</p>
            <p class="subtext">No city found</p>
            <p class="subtext">with ${type} weather now</p>
        `;
         const gridItem = cardElement.closest('.grid-item');
         if (gridItem) {
            gridItem.style.cursor = 'default';
            gridItem.onclick = null; // Scoate eventul de click
        }
    }

    populateWeatherCards(); // Apeleaza functia pentru a popula cardurile la incarcarea paginii
}
});