document.addEventListener("DOMContentLoaded", () => {
    const newsListElement = document.getElementById("news-list");
    const newsSection = document.getElementById("news-section");
    const NEWS_API_KEY = '550ef056a2894c828b23995e1fce8cf1'; 

    /**
     * I build a dynamic search query for the NewsAPI.
     * I prioritize news related to the user's favorite cities if any exist.
     */
    function buildNewsQuery() {
        // I retrieve the favorites from local storage.
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        let query = '';

        // I define fallback keywords for general weather news if the user has no favorites.
        const weatherKeywords = [
            '"weather forecast"', 
            'climate',
            'temperature record', 
            'precipitation',
            'rainfall', 
            'snowfall', 
            'blizzard',
            'hurricane',
            'typhoon',
            'cyclone',
            'heatwave',
            'cold snap',
            'drought',
            '"air quality"' 
        ].join(' OR ');

        if (favorites.length > 0) {
            // I construct a query specifically for the favorite cities.
            // I sanitize the city name by taking only the part before the comma (e.g., "London, UK" -> "London").
            query = favorites
                .map(city => `"${city.split(',')[0].trim()}"`) 
                .join(' OR ');
            console.log("News query based on favorites AND weather keywords:", query);
        } else {
            // I fallback to general weather keywords.
            query = weatherKeywords;
            console.log("News query (general weather keywords only):", query);
        }
        return query;
    }

    /**
     * I fetch weather-related news articles from the external API.
     */
    async function fetchWeatherNews() {
        const query = buildNewsQuery();
        // I set the date range to fetch articles from the last 30 days.
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateTo.getDate() - 30);

        // I restrict the search to trusted domains to ensure content relevance.
        const domainsToSearch = 'weather.com,wunderground.com,accuweather.com,global.weathernews.com';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&domains=${domainsToSearch}&apiKey=${NEWS_API_KEY}`;
        console.log("Fetching News URL:", url);

        if (newsListElement) {
            newsListElement.innerHTML = "<li>Loading news...</li>"; 
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`NewsAPI Error: ${errorData.message || response.status}`);
            }
            const data = await response.json();

            if (data.status === "ok") {
                // I check if we found specific news for the favorite cities.
                const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
                if (favorites.length > 0 && data.articles && data.articles.length > 0) {
                    console.log(`Found ${data.articles.length} news articles related to favorites.`);
                    displayWeatherNews(data.articles);
                }
                // If no specific news was found (or favorites list is empty), I fallback to general news.
                else if (!favorites.length || (data.articles && data.articles.length === 0)) {
                    console.log("No favorites or no news found for favorites. Fetching general weather news...");
                    await fetchGeneralWeatherNews(); 
                }
                 else { 
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
            addNewsApiAttribution(); 
        }
    }

    /**
     * Fallback function to fetch general weather news if specific city queries fail.
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
     * I render the news articles into the DOM.
     */
    function displayWeatherNews(articles) {
        if (!newsListElement) return;

        if (!articles || articles.length === 0) {
            newsListElement.innerHTML = "<li>No relevant weather news found recently.</li>";
             addNewsApiAttribution(); 
            return;
        }

        newsListElement.innerHTML = ""; 

        articles.forEach(article => {
            // I filter out articles with titles containing irrelevant keywords (like stocks or markets).
            const titleLower = article.title.toLowerCase();
            if (titleLower.includes("stock") || titleLower.includes("market") || titleLower.includes("politics")) {
                 console.log("Skipping potentially irrelevant article:", article.title);
                 return; 
            }

            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = article.url;
            link.textContent = article.title;
            link.target = "_blank";
            link.rel = "noopener noreferrer"; // Security best practice for external links.

            const source = document.createElement("p");
            source.textContent = `Source: ${article.source.name || 'Unknown'}`;

            listItem.appendChild(link);
            listItem.appendChild(source);
            newsListElement.appendChild(listItem);
        });

        addNewsApiAttribution();
    }

    /**
     * I append the required attribution link for NewsAPI.org.
     */
    function addNewsApiAttribution() {
        if (!newsSection || document.getElementById('news-attribution')) return;

        const attribution = document.createElement('div');
        attribution.id = 'news-attribution';
        attribution.innerHTML = 'Powered by <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer">NewsAPI.org</a>';
        newsSection.appendChild(attribution);
    }

    // I start the news fetching process when the script loads.
    fetchWeatherNews(); 
});