document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = '1ed72901fef34a7da48182141250901';
    const pexelsApiKey = 'wyj6VC2CBQIWPciaWM5rU3aD5PI0IOFiADXB075GuZrd0lKG3sUvUalh';
    const forecastCard = document.getElementById("forecast-card");
    const currentWeatherCard = document.getElementById("current-weather-card");
    const dailyChartContainer = document.getElementById("daily-temp-chart-container");
    const hourlyChartContainer = document.getElementById("hourly-rain-chart-container");
    const dailyTempCtx = document.getElementById('dailyTempChart')?.getContext('2d');
    const hourlyRainCtx = document.getElementById('hourlyRainChart')?.getContext('2d');
    let dailyTempChartInstance = null; // Variabile pentru a tine graficele
    let hourlyRainChartInstance = null;

    function getCityFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('city');
    }

    // Functie pentru a extrage prognoza meteo pentru un oras si a afisa spinner-ul
    function fetchForecast(cityOrCoords) {
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityOrCoords}&days=7`;

        showSpinner();
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Weather API request failed');
                }
                return response.json();
            })

            .then(data => {
                console.log("Fetched forecast data:", data);
                displayForecast(data);
                displayCurrentWeather(data);

                if (data && data.location && data.location.name) {
                    const cityName = data.location.name;
                    fetchCityPhoto(cityName);
                } else {
                    console.error("Could not get city name from Weather API response to fetch photo.");
                }

                createDailyTempChart(data);;
                createHourlyRainChart(data);

                hideSpinner();
            })

            .catch(error => {
                console.error("Error fetching forecast data:", error);
                forecastCard.innerHTML = "<p>Could not load forecast data. Please check the city name or try again later.</p>";
                forecastCard.classList.remove("hidden");
                currentWeatherCard.classList.add("hidden");

                dailyChartContainer.classList.add("hidden");
                hourlyChartContainer.classList.add("hidden");

                hideSpinner();
            });
    }

    // Functie pentru a extrage o fotografie a orasului
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
                    document.body.style.backgroundImage = `url(${photoUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                } else {
                    console.error("No photos found for the city:", city);
                }
            })
            .catch(error => console.error("Error fetching city photo:", error));
    }

    // Functie pentru a afisa prognoza meteo
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

    function determineWeatherClass(weatherData) {
        if (!weatherData || !weatherData.condition || !weatherData.condition.text) return '';

        const conditionText = weatherData.condition.text.toLowerCase();
        const timeString = weatherData.localtime || weatherData.last_updated;
        let hour = -1;
        if (timeString) {
            try {
                const timePart = timeString.split(' ')[1];
                hour = timePart ? parseInt(timePart.split(':')[0], 10) : new Date(timeString).getHours();
            } catch(e) { console.error("Could not parse time:", timeString); }
        }
        console.log('Determining class - Hour:', hour, 'Condition:', conditionText);

        // Ninsoare
        if (conditionText.includes('snow') || conditionText.includes('sleet') || conditionText.includes('ice pellets')) {
            return 'snow';
        }
        // Furtuna
        if (conditionText.includes('thunder') || conditionText.includes('storm') || conditionText.includes('heavy rain') || conditionText.includes('torrential rain')) {
            return 'storm';
        }
        // Ploaie
        if (conditionText.includes('rain') || conditionText.includes('drizzle') || conditionText.includes('cloudy') || conditionText.includes('overcast') || conditionText.includes('mist') || conditionText.includes('fog')) {
            return 'rain';
        }
        // Noapte
        if (hour !== -1 && (hour >= 18 || hour < 6)) {
            return 'night';
        }
        // Soare
        if (conditionText.includes('sunny') || conditionText.includes('clear') || conditionText.includes('partly cloudy')) {
            return 'sunny';
        }
        // 6. Default: Nimic
        return '';
    }

    // Functie pentru a afisa datele meteo curente
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
    
    const city = getCityFromUrl();
    if (city) {
        fetchForecast(city);
    } else {
        console.error("No city specified in URL parameters");
    }

    /**
    * Creează și afișează graficul pentru temperatura zilnică (max/min).
    */
    function createDailyTempChart(data) {
        if (!dailyTempCtx || !data?.forecast?.forecastday) {
            console.error("Daily temp chart context or forecast data missing.");
            dailyChartContainer.classList.add("hidden");
            return;
        }

        // Distruge graficul vechi daca exista (pentru cautari noi)
        if (dailyTempChartInstance) {
            dailyTempChartInstance.destroy();
        }

        const forecastDays = data.forecast.forecastday;

        // Extrage datele pentru grafic
        const labels = forecastDays.map(day => day.date.substring(5)); // Format 'MM-DD'
        const maxTemps = forecastDays.map(day => day.day.maxtemp_c);
        const minTemps = forecastDays.map(day => day.day.mintemp_c);

        dailyChartContainer.classList.remove("hidden"); // Arata containerul

        dailyTempChartInstance = new Chart(dailyTempCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Max Temp (°C)',
                        data: maxTemps,
                        borderColor: 'rgb(255, 99, 132)', // Rosu
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1 // Linie usor curba
                    },
                    {
                        label: 'Min Temp (°C)',
                        data: minTemps,
                        borderColor: 'rgb(54, 162, 235)', // Albastru
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
                        beginAtZero: false, // Axa Y poate incepe de la temp. negative
                        ticks: { color: 'white' }, // Culoare text axe
                        grid: { color: 'rgba(255, 255, 255, 0.2)' } // Culoare linii grid
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white' } // Culoare text legenda
                    }
                }
            }
        });
    }

    /**
     * Creează și afișează graficul orar pentru șansa de ploaie.
     */
    function createHourlyRainChart(data) {
        // WeatherAPI ofera prognoza orara doar pentru ziua curenta si urmatoarele 2 zile
        // Vom lua datele orare din prima zi de prognoza.
        if (!hourlyRainCtx || !data?.forecast?.forecastday?.[0]?.hour) {
            console.error("Hourly rain chart context or hourly forecast data missing.");
            hourlyChartContainer.classList.add("hidden");
            return;
        }

        // Distruge graficul vechi
        if (hourlyRainChartInstance) {
            hourlyRainChartInstance.destroy();
        }

        const hourlyData = data.forecast.forecastday[0].hour;

        // Extrage datele (ora si sansa de ploaie)
        const labels = hourlyData.map(hourData => hourData.time.substring(11)); // Format 'HH:MM'
        const rainChance = hourlyData.map(hourData => hourData.chance_of_rain + 1);

        hourlyChartContainer.classList.remove("hidden");

        hourlyRainChartInstance = new Chart(hourlyRainCtx, {
            type: 'bar', // Grafic cu bare
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chance of Rain (%)',
                    data: rainChance,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Culoare bare
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
                        //beginAtZero: true,
                        min: 0,
                        max: 101, // Procentaj maxim e 100
                        ticks: {
                            color: 'white',
                            stepSize: 20,
                            callback: function(value) {
                                if (value === 1) return '0%'; // Corectare pentru valoarea 1
                                if (value === 101) return '100%'; // Corectare pentru valoarea 101
                                if (value % 20 === 0) {
                                    return (value) + '%';
                                }
                                return '';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' }
                    },
                    x: {
                        ticks: { color: 'white', maxRotation: 90, minRotation: 70 }, // Rotesc etichetele orei
                        grid: { display: false } // Ascund gridul X
                    }
                },
                plugins: {
                    legend: {
                        display: false // Nu avem nevoie de legenda pt un singur set de date
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                // Scad 1 pentru a corecta valoarea afisata
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