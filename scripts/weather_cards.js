document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    const nightCard = document.querySelector('.card-night').nextElementSibling;
    const rainCard = document.querySelector('.card-rain').nextElementSibling;
    const snowCard = document.querySelector('.card-snow').nextElementSibling;
    const stormCard = document.querySelector('.card-storm').nextElementSibling;
    const sunnyCard = document.querySelector('.card-sunny').nextElementSibling;

    const majorCities = [
        'Tokyo', 'Delhi', 'Shanghai', 'São Paulo', 'Mexico City', 'Dhaka', 'Cairo', 'Mumbai', 'Beijing', 'Osaka',
        'Karachi', 'Chongqing', 'Istanbul', 'Lagos', 'Kolkata', 'Kinshasa', 'Buenos Aires', 'Tianjin', 'London', 'Lahore',
        'Shenzhen', 'Hong Kong', 'Hangzhou', 'Chennai', 'Riyadh', 'Bangalore', 'Lima', 'New York', 'Guangzhou', 'Chengdu',
        'Nairobi', 'Jakarta', 'Ho Chi Minh City', 'Shijiazhuang', 'Ahmedabad', 'Paris', 'Bogotá', 'Abidjan', 'Hong Kong',
        'Sydney', 'Rome', 'Mexico City', 'Lagos', 'Kinshasa', 'Lahore', 'Bangkok', 'Kuala Lumpur', 'Rio de Janeiro',
        'Berlin', 'Madrid', 'San Salvador', 'Vancouver', 'Moscow', 'Tehran', 'Paris', 'New York', 'Seoul', 'London', 
        'Kiev', 'Milan', 'Dubai', 'Tashkent', 'Kabul', 'Minsk', 'Montreal', 'Ankara', 'Düsseldorf', 'Buenos Aires',
        'Karachi', 'Chicago', 'Durban', 'New York', 'Bucharest', 'Madrid', 'Lisbon', 'Washington D.C.', 'Melbourne',
        'Cairo', 'Miami', 'Barcelona', 'Belo Horizonte', 'Ho Chi Minh City', 'Perth', 'Manila', 'Barcelona', 'Wuhan',
        'Toronto', 'Santiago', 'Madrid', 'Stockholm', 'Düsseldorf', 'Rotterdam', 'Berlin', 'Paris', 'New York',
        'Vancouver', 'Sydney', 'Los Angeles', 'Brussels', 'Stockholm', 'San Francisco', 'Munich', 'Portland', 'St. Petersburg',
        'Kuala Lumpur', 'Frankfurt', 'Dallas', 'Vienna', 'Los Angeles', 'Sydney', 'Paris', 'Singapore', 'Taipei',
        'San Francisco', 'Osaka', 'Cape Town', 'Shenzhen', 'Kolkata', 'Nairobi', 'Seoul', 'Copenhagen', 'Milan', 
        'London', 'Madrid', 'Rome', 'Cape Town', 'Beijing', 'Mexico City', 'Boston', 'Montreal', 'Paris', 'Oslo',
        'Chicago', 'Houston', 'Madrid', 'Moscow', 'Berlin', 'New York', 'London', 'Las Vegas', 'Toronto', 'Rome'
      ];
      

    // Functie pentru a prelua datele meteo
    function fetchWeather(query) {
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${query}`;

        return fetch(url)
            .then(response => response.json())
            .catch(error => console.error("Error fetching weather data:", error));
    }

    // Functie pentru a determina daca este noapte
    function isNight(localTime) {
        const hour = new Date(localTime).getHours();
        //console.log(`Hour: ${hour}`);
        return hour >= 18 || hour < 6;
    }

    // Functie pentru a determina daca este ploaie
    function isRaining(condition) {
        return condition.toLowerCase().includes('light rain');
    }

    // Functie pentru a determina daca este zapada
    function isSnowing(condition) {
        return condition.toLowerCase().includes('snow');
    }

    // Functie pentru a determina daca este furtuna
    function isStorming(condition) {
        return condition.toLowerCase().includes('heavy rain');
    }

    // Functie pentru a determina daca este soare
    function isSunny(condition) {
        return condition.toLowerCase().includes('sunny');
    }

    // Functie pentru a actualiza cardul cu noapte pentru orasul unde este noapte
    function updateNightCard(city, data) {
        if (nightCard) {
            nightCard.innerHTML = `
                <p class="cardtitle">${data.current.temp_c} &deg;C</p>
                <p class="subtext">${city} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime}</p>
            `;
        } else {
            console.error("Night card element not found");
        }
    }

    // Functie pentru a actualiza cardul cu ploaie pentru orasul unde este ploaie
    function updateRainCard(city, data) {
        if (rainCard) {
            rainCard.innerHTML = `
                <p class="cardtitle">${data.current.temp_c} &deg;C</p>
                <p class="subtext">${city} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime}</p>
            `;
        } else {
            console.error("Rain card element not found");
        }
    }
    
    // Functie pentru a actualiza cardul cu zapada pentru orasul unde este zapada
    function updateSnowCard(city, data) {
        if (snowCard) {
            snowCard.innerHTML = `
                <p class="cardtitle">${data.current.temp_c} &deg;C</p>
                <p class="subtext">${city} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime}</p>
            `;
        } else {
            console.error("Snow card element not found");
        }
    }

    // Functie pentru a actualiza cardul cu furtuna pentru orasul unde este furtuna
    function updateStormCard(city, data) {
        if (stormCard) {
            stormCard.innerHTML = `
                <p class="cardtitle">${data.current.temp_c} &deg;C</p>
                <p class="subtext">${city} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime}</p>
            `;
        } else {
            console.error("Storm card element not found");
        }
    }

    // Functie pentru a actualiza cardul cu soare pentru orasul unde este soare
    function updateSunnyCard(city, data) {
        if (sunnyCard) {
            sunnyCard.innerHTML = `
                <p class="cardtitle">${data.current.temp_c} &deg;C</p>
                <p class="subtext">${city} - ${data.current.condition.text}</p>
                <p class="subtext">Local Time: ${data.location.localtime}</p>
            `;
        } else {
            console.error("Sunny card element not found");
        }
    }

    // Cauta orase "night"
    async function checkMajorCitiesForNight() {
        for (const city of majorCities) {
            //console.log('Checking city:', city); // Log each city being checked
            const weatherData = await fetchWeather(city);
            if (weatherData && isNight(weatherData.location.localtime)) {
                //console.log(`City: ${city}, Local Time: ${weatherData.location.localtime}, Is Night: ${isNight(weatherData.location.localtime)}`);
                updateNightCard(city, weatherData);
                break; // Gaseste primul oras "night"
            }
        }
    }

    //  Cauta orase "rain"
    async function checkMajorCitiesForRain() {
        for (const city of majorCities) {
            //console.log('Checking city for rain:', city); // Log each city being checked
            const weatherData = await fetchWeather(city);
            if (weatherData && isRaining(weatherData.current.condition.text)) {
                //console.log(`City: ${city}, Local Time: ${weatherData.location.localtime}, Is Raining: ${isRaining(weatherData.current.condition.text)}`);
                updateRainCard(city, weatherData);
                break; // Gasete primul oras "rain"
            }
        }
    }

    // Cauta orase "snow"
    async function checkMajorCitiesForSnow() {
        for (const city of majorCities) {
            //console.log('Checking city for snow:', city); // Log each city being checked
            const weatherData = await fetchWeather(city);
            if (weatherData && isSnowing(weatherData.current.condition.text)) {
                //console.log(`City: ${city}, Local Time: ${weatherData.location.localtime}, Is Snowing: ${isSnowing(weatherData.current.condition.text)}`);
                updateSnowCard(city, weatherData);
                break; // Gaseste primul oras "snow"
            }
        }
    }

    // Cauta oras "storm"
    async function checkMajorCitiesForStorm() {
        for (const city of majorCities) {
            //console.log('Checking city for storm:', city); // Log each city being checked
            const weatherData = await fetchWeather(city);
            if (weatherData && isStorming(weatherData.current.condition.text)) {
                //console.log(`City: ${city}, Local Time: ${weatherData.location.localtime}, Is Storming: ${isStorming(weatherData.current.condition.text)}`);
                updateStormCard(city, weatherData);
                break; // Gasete primul oras "storm"
            }
        }
    }

    // Cauta orase "sunny"
    async function checkMajorCitiesForSunny() {
        for (const city of majorCities) {
            //console.log('Checking city for sunny:', city); // Log each city being checked
            const weatherData = await fetchWeather(city);
            if (weatherData && isSunny(weatherData.current.condition.text)) {
                //console.log(`City: ${city}, Local Time: ${weatherData.location.localtime}, Is Sunny: ${isSunny(weatherData.current.condition.text)}`);
                updateSunnyCard(city, weatherData);
                break; // Gaseste primul oras "sunny"
            }
        }
    }

    checkMajorCitiesForNight();
    checkMajorCitiesForRain();
    checkMajorCitiesForSnow();
    checkMajorCitiesForStorm();
    checkMajorCitiesForSunny();
});