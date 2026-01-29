document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    
    // I significantly expanded these city lists to ensure that at any given time,
    // the algorithm can find a city matching the specific weather condition (Night, Rain, Snow, etc.).
    // This prevents empty or "Not Found" cards on the homepage.
    const cityLists = {
        night: [
            'Tokyo', 'Sydney', 'London', 'New York', 'Los Angeles', 
            'Beijing', 'Moscow', 'Paris', 'Rio de Janeiro', 'Cairo', 
            'Bangkok', 'Singapore', 'Dubai', 'Seoul', 'Mumbai', 'Hong Kong',
            'Istanbul', 'Shanghai', 'Buenos Aires', 'Chicago'
        ], 
        rain: [
            'Mawsynram', 'Cherrapunji', 'Tutunendo', 'San Antonio de Ureca', 'London',
            'Seattle', 'Vancouver', 'Bergen', 'Hilo', 'Taipei', 
            'Portland', 'Glasgow', 'Singapore', 'Kuala Lumpur', 'Manaus',
            'Dublin', 'Jakarta', 'Bogota', 'Copenhagen', 'Brussels'
        ],   
        snow: [
            'Sapporo', 'Aomori', 'Quebec City', 'Anchorage', 'Murmansk',
            'Helsinki', 'Oslo', 'Moscow', 'Harbin', 'Novosibirsk', 
            'Nuuk', 'Reykjavik', 'Minneapolis', 'Winnipeg', 'Tromso',
            'Calgary', 'Ulaanbaatar', 'Astana', 'Erzurum', 'Kiruna'
        ], 
        storm: [
            'Tampa', 'Miami', 'Fort Myers', 'New Orleans', 'Mumbai',
            'Manila', 'Darwin', 'Hong Kong', 'Houston', 'Cancun', 
            'Dhaka', 'Kolkata', 'San Juan', 'Havana', 'Taipei',
            'Oklahoma City', 'Orlando', 'Chennai', 'Ho Chi Minh City', 'Nassau'
        ], 
        sunny: [
            'Cairo', 'Dubai', 'Los Angeles', 'Athens', 'Lisbon',
            'Phoenix', 'Las Vegas', 'Alice Springs', 'Riyadh', 'Khartoum', 
            'Perth', 'Seville', 'Marseille', 'Tel Aviv', 'Abu Dhabi',
            'Doha', 'Muscat', 'Yuma', 'San Diego', 'Aswan'
        ]  
    };

    // I cache references to the DOM elements that will display the status.
    const cardStatusElements = {
        night: document.querySelector('.card-night').nextElementSibling,
        rain: document.querySelector('.card-rain').nextElementSibling,
        snow: document.querySelector('.card-snow').nextElementSibling,
        storm: document.querySelector('.card-storm').nextElementSibling,
        sunny: document.querySelector('.card-sunny').nextElementSibling
    };

    // Main Function: I iterate through weather types to find and display a matching city.
    async function populateWeatherCards() {
        const weatherTypes = Object.keys(cityLists); 

        for (const type of weatherTypes) {
            console.log(`Searching for a city with weather type: ${type}`);
            let foundCityData = null; 

            // I select the specific validation function for the current weather type.
            let checkFunction;
            switch (type) {
                case 'night': checkFunction = isConditionNight; break;
                case 'rain':  checkFunction = isConditionRain;  break;
                case 'snow':  checkFunction = isConditionSnow;  break;
                case 'storm': checkFunction = isConditionStorm; break;
                case 'sunny': checkFunction = isConditionSunny; break;
                default:      checkFunction = () => false; 
            }

            // I iterate through the expanded list of cities.
            for (const city of cityLists[type]) {
                try {
                    const weatherData = await fetchWeather(city); 
                    if (!weatherData) continue; 

                    // If the city matches the specific condition, I save it and stop searching for this type.
                    if (checkFunction(weatherData)) {
                        console.log(`Found matching city for SPECIFIC type ${type}: ${city}`);
                        foundCityData = weatherData;
                        break; 
                    } else {
                        console.log(`City ${city} does not match type ${type}. Trying next...`);
                    }
                } catch (error) {
                    console.error(`Error fetching weather for ${city}:`, error);
                }
            }

            // I update the UI card with the data found (or show a placeholder if nothing matched).
            updateCard(type, foundCityData);
        }
    }

    // Generic API fetcher with timeout handling.
    function fetchWeather(city) {
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
        
        // I use AbortController to prevent the request from hanging indefinitely.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

        return fetch(url, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId); 
                if (!response.ok) {
                    throw new Error(`Network response was not ok for ${city}`);
                }
                return response.json();
            })
            .catch(error => {
                clearTimeout(timeoutId); 
                if (error.name === 'AbortError') {
                    console.error(`Fetch aborted for ${city} (timeout)`);
                } else {
                    console.error(`Fetch error for ${city}:`, error);
                }
                return null; 
            });
    }

    // --- Weather Condition Checkers ---
    // I implemented specific logic to verify if the API data matches the desired card type.

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
        // I verify it is daytime, as "clear" can also mean a clear night.
        if (isConditionNight(weatherData)) return false; 
        return conditionText.includes('sunny') || conditionText.includes('clear');
    }

    // I update the card DOM elements with the fetched data.
    function updateCard(type, data) {
        const cardElement = cardStatusElements[type]; 
        if (!cardElement) {
            console.error(`Card element for type ${type} not found.`);
            return;
        }

        if (data && data.location && data.current) {
            cardElement.innerHTML = `
                <p class="cardtitle">${data.current.temp_c}&deg;C</p>
                <p class="subtext">${data.location.name} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime.split(' ')[1]}</p> `;
            
            // I make the card clickable to take the user to the detailed view.
            const gridItem = cardElement.closest('.grid-item'); 
            if (gridItem) {
                gridItem.style.cursor = 'pointer'; 
                gridItem.onclick = () => {
                    window.location.href = `city_weather.html?city=${encodeURIComponent(data.location.name)}`;
                };
            }

        } else {
            // Fallback UI.
            cardElement.innerHTML = `
                <p class="cardtitle">?</p>
                <p class="subtext">No city found</p>
                <p class="subtext">with ${type} weather now</p>
            `;
            const gridItem = cardElement.closest('.grid-item');
            if (gridItem) {
                gridItem.style.cursor = 'default';
                gridItem.onclick = null; 
            }
        }
    }
    
    // I initiate the population of weather cards on page load.
    populateWeatherCards(); 
});