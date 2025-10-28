document.addEventListener("DOMContentLoaded", () => {
    const newsListElement = document.getElementById("news-list");
    const newsSection = document.getElementById("news-section");
    const NEWS_API_KEY = '550ef056a2894c828b23995e1fce8cf1'; // !!! Înlocuiește cu cheia ta reală !!!

    /**
     * Construiește query-ul pentru NewsAPI.
     * Prioritizează știrile din orașele favorite.
     * @returns {string} Query-ul final pentru API.
     */
    function buildNewsQuery() {
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        let query = '';

        // --- LISTA ÎMBUNĂTĂȚITĂ DE CUVINTE CHEIE METEO ---
        // Folosim ghilimele pentru expresii exacte și combinăm cu OR
        // Excludem termeni generali care pot fi ambigui (ex: doar 'storm' poate fi despre politică)
        /*const weatherKeywords = [
            '"weather forecast"', // Expresie exactă
            'climate',
            'temperature record', // Mai specific
            'precipitation',
            'rainfall', // Mai specific
            'snowfall', // Mai specific
            'blizzard',
            'hurricane',
            'typhoon',
            'cyclone',
            'heatwave',
            'cold snap',
            'drought',
            '"air quality"' // Expresie exactă
        ].join(' OR '); // Le combinăm cu OR
        // --- SFÂRȘIT LISTĂ CUVINTE CHEIE ---*/

        if (favorites.length > 0) {
            // Construim query DOAR cu orașele favorite: ("Oraș1" OR "Oraș2" ...)
            // Extragem doar numele orașului (partea dinainte de virgulă)
            query = favorites
                .map(city => `"${city.split(',')[0].trim()}"`) 
                .join(' OR ');
            console.log("News query based on favorites AND weather keywords:", query);
        } else {
            // Fallback la știri generale despre vreme dacă nu există favorite
            // Folosim doar cuvintele cheie meteo
            query = weatherKeywords;
            console.log("News query (general weather keywords only):", query);
        }
        return query;
    }

    /**
     * Preia știrile despre vreme de la NewsAPI folosind query-ul construit.
     */
    async function fetchWeatherNews() {
        const query = buildNewsQuery();
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateTo.getDate() - 30);

        const domainsToSearch = 'weather.com,wunderground.com,accuweather.com,global.weathernews.com';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&domains=${domainsToSearch}&apiKey=${NEWS_API_KEY}`;
        console.log("Fetching News URL:", url);

        if (newsListElement) {
            newsListElement.innerHTML = "<li>Loading news...</li>"; // Mesaj de încărcare
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`NewsAPI Error: ${errorData.message || response.status}`);
            }
            const data = await response.json();

            if (data.status === "ok") {
                // Dacă avem favorite ȘI am primit rezultate, le afișăm
                const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
                if (favorites.length > 0 && data.articles && data.articles.length > 0) {
                    console.log(`Found ${data.articles.length} news articles related to favorites.`);
                    displayWeatherNews(data.articles);
                }
                // Dacă NU avem favorite SAU query-ul pentru favorite nu a returnat nimic,
                // încercăm un query general.
                else if (!favorites.length || (data.articles && data.articles.length === 0)) {
                    console.log("No favorites or no news found for favorites. Fetching general weather news...");
                    await fetchGeneralWeatherNews(); // Apelăm funcția de fallback
                }
                 else { // Caz neașteptat (ex: data.articles e undefined)
                    throw new Error("Invalid response structure from NewsAPI.");
                }

            } else {
                throw new Error(data.message || "Could not fetch news.");
            }

        } catch (error) {
            console.error("Error fetching initial weather news:", error);
            if (newsListElement) {
                newsListElement.innerHTML = "<li>Could not load weather news at this time.</li>";
            }
            addNewsApiAttribution(); // Adăugăm atribuirea chiar și la eroare
        }
    }

    /**
     * Funcție de Fallback: Preia știri generale despre vreme dacă nu există favorite
     * sau dacă nu s-au găsit știri specifice favoritelor.
     */
    async function fetchGeneralWeatherNews() {
         const generalQuery = '"weather forecast" OR climate OR storm OR temperature OR rain OR snow OR heatwave OR coldwave';
         const domainsToSearch = 'weather.com,wunderground.com,accuweather.com,global.weathernews.com';
         const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(generalQuery)}&language=en&sortBy=relevancy&pageSize=5&domains=${domainsToSearch}&apiKey=${NEWS_API_KEY}`;
         console.log("Fetching General News URL:", url);

         try {
             const response = await fetch(url);
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(`NewsAPI Error (General): ${errorData.message || response.status}`);
             }
             const data = await response.json();

             if (data.status === "ok" && data.articles) {
                  console.log(`Found ${data.articles.length} general weather news articles.`);
                 displayWeatherNews(data.articles);
             } else {
                 throw new Error(data.message || "Could not fetch general news.");
             }
         } catch(error) {
              console.error("Error fetching general weather news:", error);
              if (newsListElement) {
                 newsListElement.innerHTML = "<li>Could not load general weather news.</li>";
              }
              addNewsApiAttribution();
         }
    }


    /**
     * Afișează știrile în lista UL
     */
    function displayWeatherNews(articles) {
        if (!newsListElement) return;

        if (!articles || articles.length === 0) {
            newsListElement.innerHTML = "<li>No relevant weather news found recently.</li>";
             addNewsApiAttribution(); // Adaugam atribuirea si aici
            return;
        }

        newsListElement.innerHTML = ""; // Golim mesajul "Loading..."

        articles.forEach(article => {
            // Verificare simplă dacă titlul conține termeni irelevanți comuni (poate fi îmbunătățită)
            const titleLower = article.title.toLowerCase();
            if (titleLower.includes("stock") || titleLower.includes("market") || titleLower.includes("politics")) {
                 console.log("Skipping potentially irrelevant article:", article.title);
                 return; // Sari peste articole probabil irelevante
            }


            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = article.url;
            link.textContent = article.title;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            const source = document.createElement("p");
            source.textContent = `Source: ${article.source.name || 'Unknown'}`;

            listItem.appendChild(link);
            listItem.appendChild(source);
            newsListElement.appendChild(listItem);
        });

        addNewsApiAttribution();
    }

    /**
     * Adaugă link-ul de atribuire pentru NewsAPI.org
     */
    function addNewsApiAttribution() {
        if (!newsSection || document.getElementById('news-attribution')) return;

        const attribution = document.createElement('div');
        attribution.id = 'news-attribution';
        attribution.innerHTML = 'Powered by <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer">NewsAPI.org</a>';
        newsSection.appendChild(attribution);
    }

    // --- Inițializare ---
    fetchWeatherNews(); // Apelăm funcția principală la încărcarea paginii
});