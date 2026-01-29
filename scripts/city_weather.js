document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    const pexelsApiKey = 'wyj6VC2CBQIWPciaWM5rU3aD5PI0IOFiADXB075GuZrd0lKG3sUvUalh';
    
    // I cache DOM elements for efficient manipulation later.
    const forecastCard = document.getElementById("forecast-card");
    const currentWeatherCard = document.getElementById("current-weather-card");
    const dailyChartContainer = document.getElementById("daily-temp-chart-container");
    const hourlyChartContainer = document.getElementById("hourly-rain-chart-container");
    const dailyTempCtx = document.getElementById('dailyTempChart')?.getContext('2d');
    const hourlyRainCtx = document.getElementById('hourlyRainChart')?.getContext('2d');
    
    // I use these variables to store chart instances so I can destroy them before re-rendering.
    let dailyTempChartInstance = null; 
    let hourlyRainChartInstance = null;

    // Helper to parse the city query parameter from the URL.
    function getCityFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('city');
    }

    // Core function: Fetches weather data for a specific city or coordinates.
    // I show a spinner to indicate loading state to the user.
    function fetchForecast(cityOrCoords) {
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityOrCoords}&days=7`;

        showSpinner();
        fetch(url)
            .then(response => {
                // I handle non-200 responses to catch API errors (e.g., city not found).
                if (!response.ok) {
                    throw new Error('Weather API request failed');
                }
                return response.json();
            })
            .then(data => {
                console.log("Fetched forecast data:", data);
                
                // I update the UI components with the new data.
                displayForecast(data);
                displayCurrentWeather(data);

                // If valid location data exists, I fetch a dynamic background image.
                if (data && data.location && data.location.name) {
                    const cityName = data.location.name;
                    fetchCityPhoto(cityName);
                } else {
                    console.error("Could not get city name from Weather API response to fetch photo.");
                }

                // I render the data visualization charts.
                createDailyTempChart(data);;
                createHourlyRainChart(data);

                hideSpinner();
            })
            .catch(error => {
                console.error("Error fetching forecast data:", error);
                
                // I provide user feedback in case of error instead of leaving a blank screen.
                forecastCard.innerHTML = "<p>Could not load forecast data. Please check the city name or try again later.</p>";
                forecastCard.classList.remove("hidden");
                currentWeatherCard.classList.add("hidden");

                // I hide the charts if no data is available.
                dailyChartContainer.classList.add("hidden");
                hourlyChartContainer.classList.add("hidden");

                hideSpinner();
            });
    }

    // I enhance the UX by fetching a relevant city background image from Pexels API.
    function fetchCityPhoto(city) {
        const url = `https://api.pexels.com/v1/search?query=${city}&per_page=1`;

        fetch(url, {
            headers: {
                Authorization: pexelsApiKey
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.photos && data.photos.length > 0) {
                    const photoUrl = data.photos[0].src.original;
                    // I apply the image to the body background.
                    document.body.style.backgroundImage = `url(${photoUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                } else {
                    console.error("No photos found for the city:", city);
                }
            })
            .catch(error => console.error("Error fetching city photo:", error));
    }

    // I generate an HTML table to display the 7-day forecast.
    function displayForecast(data) {
        if (data && data.forecast && data.forecast.forecastday) {
            let forecastTable = `
                <table>
                    <tr>
                        <th>Date</th>
                        <th>Condition</th>
                        <th>Max Temp (°C)</th>
                        <th>Min Temp (°C)</th>
                        <th>Humidity (%)</th>
                        <th>Wind Speed (mph)</th>
                    </tr>
            `;

            data.forecast.forecastday.forEach(day => {
                forecastTable += `
                    <tr>
                        <td>${day.date}</td>
                        <td>${day.day.condition.text}</td>
                        <td>${day.day.maxtemp_c}</td>
                        <td>${day.day.mintemp_c}</td>
                        <td>${day.day.avghumidity}</td>
                        <td>${day.day.maxwind_mph}</td>
                    </tr>
                `;
            });

            forecastTable += `</table>`;

            forecastCard.innerHTML = forecastTable;
            forecastCard.classList.remove("hidden");
        } else {
            console.error("Invalid data structure:", data);
        }
    }

    // I determine the appropriate CSS class for weather animations based on conditions and time of day.
    function determineWeatherClass(weatherData) {
        if (!weatherData || !weatherData.condition || !weatherData.condition.text) return '';

        const conditionText = weatherData.condition.text.toLowerCase();
        const timeString = weatherData.localtime || weatherData.last_updated;
        let hour = -1;
        
        // I parse the time string to handle day/night logic.
        if (timeString) {
            try {
                const timePart = timeString.split(' ')[1];
                hour = timePart ? parseInt(timePart.split(':')[0], 10) : new Date(timeString).getHours();
            } catch(e) { console.error("Could not parse time:", timeString); }
        }
        console.log('Determining class - Hour:', hour, 'Condition:', conditionText);

        if (conditionText.includes('snow') || conditionText.includes('sleet') || conditionText.includes('ice pellets')) {
            return 'snow';
        }
        if (conditionText.includes('thunder') || conditionText.includes('storm') || conditionText.includes('heavy rain') || conditionText.includes('torrential rain')) {
            return 'storm';
        }
        if (conditionText.includes('rain') || conditionText.includes('drizzle') || conditionText.includes('cloudy') || conditionText.includes('overcast') || conditionText.includes('mist') || conditionText.includes('fog')) {
            return 'rain';
        }
        // I prioritize night mode if it's between 6 PM and 6 AM.
        if (hour !== -1 && (hour >= 18 || hour < 6)) {
            return 'night';
        }
        if (conditionText.includes('sunny') || conditionText.includes('clear') || conditionText.includes('partly cloudy')) {
            return 'sunny';
        }
        return '';
    }

    // I render the current weather card with the computed animation class.
    function displayCurrentWeather(data) {
        if (data?.current && data?.location) {
            const weatherAnimationClass = determineWeatherClass({
                condition: data.current.condition,
                localtime: data.location.localtime,
                last_updated: data.current.last_updated
            });


            const currentWeather = `
                <div class="card card-${weatherAnimationClass}">
                    <div class="${weatherAnimationClass} city-weather-animation"></div>
                    <div class="status">
                        <p class="cardtitle">${data.location.name} - ${data.current.condition.text}</p>
                        <p class="subtext">Local Time: ${data.location.localtime}</p>
                    </div>
                </div>
            `;

            currentWeatherCard.innerHTML = currentWeather;
            currentWeatherCard.classList.remove("hidden");
        } else {
            console.error("Invalid data structure:", data);
        }
    }
    
    // Initial execution: Check URL for city parameter and fetch data.
    const city = getCityFromUrl();
    if (city) {
        fetchForecast(city);
    } else {
        console.error("No city specified in URL parameters");
    }

    /**
    * I create the line chart for Daily Temperature (Max/Min) using Chart.js.
    */
    function createDailyTempChart(data) {
        if (!dailyTempCtx || !data?.forecast?.forecastday) {
            console.error("Daily temp chart context or forecast data missing.");
            dailyChartContainer.classList.add("hidden");
            return;
        }

        // I destroy the previous chart instance to avoid "canvas reuse" errors or data overlapping.
        if (dailyTempChartInstance) {
            dailyTempChartInstance.destroy();
        }

        const forecastDays = data.forecast.forecastday;

        // I extract labels (dates) and data points (temperatures).
        const labels = forecastDays.map(day => day.date.substring(5)); // Format 'MM-DD'
        const maxTemps = forecastDays.map(day => day.day.maxtemp_c);
        const minTemps = forecastDays.map(day => day.day.mintemp_c);

        dailyChartContainer.classList.remove("hidden");

        dailyTempChartInstance = new Chart(dailyTempCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Max Temp (°C)',
                        data: maxTemps,
                        borderColor: 'rgb(255, 99, 132)', // Red
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1 // Smooth curves
                    },
                    {
                        label: 'Min Temp (°C)',
                        data: minTemps,
                        borderColor: 'rgb(54, 162, 235)', // Blue
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 3,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }

    /**
     * I create the bar chart for Hourly Rain Chance.
     */
    function createHourlyRainChart(data) {
        // I grab hourly data from the first forecast day.
        if (!hourlyRainCtx || !data?.forecast?.forecastday?.[0]?.hour) {
            console.error("Hourly rain chart context or hourly forecast data missing.");
            hourlyChartContainer.classList.add("hidden");
            return;
        }

        if (hourlyRainChartInstance) {
            hourlyRainChartInstance.destroy();
        }

        const hourlyData = data.forecast.forecastday[0].hour;

        const labels = hourlyData.map(hourData => hourData.time.substring(11)); // Format 'HH:MM'
        // I offset the value by 1 to ensure 0% is distinguishable from no data (visual tweak).
        const rainChance = hourlyData.map(hourData => hourData.chance_of_rain + 1);

        hourlyChartContainer.classList.remove("hidden");

        hourlyRainChartInstance = new Chart(hourlyRainCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chance of Rain (%)',
                    data: rainChance,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 3,
                scales: {
                    y: {
                        min: 0,
                        max: 101, 
                        ticks: {
                            color: 'white',
                            stepSize: 20,
                            callback: function(value) {
                                // I adjust the labels back to original values (reversing the +1 offset).
                                if (value === 1) return '0%'; 
                                if (value === 101) return '100%'; 
                                if (value % 20 === 0) {
                                    return (value) + '%';
                                }
                                return '';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' }
                    },
                    x: {
                        ticks: { color: 'white', maxRotation: 90, minRotation: 70 },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        display: false 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const actualValue = context.parsed.y - 1;
                                label += actualValue + '%';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
});