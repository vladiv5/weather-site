document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    
    const cityLists = {
    night: ['Tokyo', 'Sydney', 'Londra', 'New York', 'Los Angeles'], // Orase probabil noaptea cand e zi in Europa
    rain: ['Mawsynram', 'Cherrapunji', 'Tutunendo', 'San Antonio de Ureca', 'London'],   // Orase cunoscute pentru ploaie
    snow: ['Sapporo', 'Aomori', 'Quebec City', 'Anchorage', 'Murmansk'], // Orase nordice/reci
    storm: ['Tampa', 'Miami', 'Fort Myers', 'New Orleans', 'Mumbai'], // Orase tropicale/predispuse la furtuni
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

        // --- SELECTAM FUNCTIA DE VERIFICARE CORECTA ---
        let checkFunction;
        switch (type) {
            case 'night': checkFunction = isConditionNight; break;
            case 'rain':  checkFunction = isConditionRain;  break;
            case 'snow':  checkFunction = isConditionSnow;  break;
            case 'storm': checkFunction = isConditionStorm; break;
            case 'sunny': checkFunction = isConditionSunny; break;
            default:      checkFunction = () => false; // Functie default care returneaza false
        }
        // Itereaza prin lista de orase specifica tipului curent
        for (const city of cityLists[type]) {
            try {
                const weatherData = await fetchWeather(city); // Cere vremea pentru oras
                if (!weatherData) continue; // Sari daca fetch esueaza

                // --- FOLOSIM FUNCTIA SPECIFICA SELECTATA ---
                if (checkFunction(weatherData)) {
                    console.log(`Found matching city for SPECIFIC type ${type}: ${city}`);
                    foundCityData = weatherData;
                    break; // Am gasit, iesim
                } else {
                    console.log(`City ${city} (condition: ${weatherData.current?.condition?.text}, time: ${weatherData.location?.localtime}) does not match SPECIFIC type ${type}. Trying next...`);
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

    function isConditionNight(weatherData) {
        if (!weatherData?.location?.localtime) return false;
        try {
            const timePart = weatherData.location.localtime.split(' ')[1];
            const hour = parseInt(timePart.split(':')[0], 10);
            return hour >= 18 || hour < 6;
        } catch (e) { return false; }
    }

    function isConditionRain(weatherData) {
        if (!weatherData?.current?.condition?.text) return false;
        const conditionText = weatherData.current.condition.text.toLowerCase();
        // Cautam specific ploaie/burnita, NU si nori/ceata aici
        return conditionText.includes('rain') || conditionText.includes('drizzle');
    }

    function isConditionSnow(weatherData) {
        if (!weatherData?.current?.condition?.text) return false;
        const conditionText = weatherData.current.condition.text.toLowerCase();
        return conditionText.includes('snow') || conditionText.includes('sleet') || conditionText.includes('ice pellets') || conditionText.includes('blizzard');
    }

    function isConditionStorm(weatherData) {
        if (!weatherData?.current?.condition?.text) return false;
        const conditionText = weatherData.current.condition.text.toLowerCase();
        return conditionText.includes('thunder') || conditionText.includes('storm') || conditionText.includes('heavy rain') || conditionText.includes('torrential rain');
    }

    function isConditionSunny(weatherData) {
        if (!weatherData?.current?.condition?.text || !weatherData?.location?.localtime) return false;
        const conditionText = weatherData.current.condition.text.toLowerCase();
        // Verificam daca e ZI inainte
        if (isConditionNight(weatherData)) return false; // Nu e soare noaptea
        return conditionText.includes('sunny') || conditionText.includes('clear');
        // Am scos 'partly cloudy' de aici pentru a fi mai specific
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
    }
populateWeatherCards(); // Apeleaza functia pentru a popula cardurile la incarcarea paginii
});