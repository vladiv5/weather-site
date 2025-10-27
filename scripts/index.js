document.addEventListener("DOMContentLoaded", () => {
    const newsListElement = document.getElementById("news-list");
    const newsSection = document.getElementById("news-section");
    const NEWS_API_KEY = '550ef056a2894c828b23995e1fce8cf1';

     // Preia stirile despre vreme de la NewsAPI
    async function fetchWeatherNews() {
        // Cautam articole cu "weather" in titlu sau descriere, din surse de stiri in engleza
        // Sortam dupa data publicarii (cele mai noi primele)
        // Limit la 5 articole
        //const url = `https://newsapi.org/v2/everything?q=weather&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;

        // Alternativ, poti cauta in titluri doar:
        const url = `https://newsapi.org/v2/everything?qInTitle=weather&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;

         // Sau poti cauta stiri de top dintr-o anumita tara pe categoria generala (mai putin relevant)
         //const url = `https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=5&apiKey=${NEWS_API_KEY}`;


        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Verificam erorile comune de la NewsAPI
                const errorData = await response.json();
                throw new Error(`NewsAPI Error: ${errorData.message || response.status}`);
            }
            const data = await response.json();

            if (data.status === "ok" && data.articles) {
                displayWeatherNews(data.articles);
            } else {
                throw new Error(data.message || "Could not fetch news.");
            }

        } catch (error) {
            console.error("Error fetching weather news:", error);
            if (newsListElement) {
               newsListElement.innerHTML = "<li>Could not load weather news at this time.</li>";
            }
             // Adaugam atribuirea chiar daca API-ul esueaza, e o cerinta
             addNewsApiAttribution();
        }
    }

    /**
     * Afiseaza stirile in lista UL
     */
    function displayWeatherNews(articles) {
        if (!newsListElement) return;

        if (articles.length === 0) {
            newsListElement.innerHTML = "<li>No recent weather news found.</li>";
            return;
        }

        newsListElement.innerHTML = ""; // Golim mesajul "Loading..."

        articles.forEach(article => {
            const listItem = document.createElement("li");

            // Cream link-ul catre articol
            const link = document.createElement("a");
            link.href = article.url;
            link.textContent = article.title;
            link.target = "_blank"; // Deschide in tab nou
            link.rel = "noopener noreferrer"; // Securitate

            // Adaugam sursa stirii
             const source = document.createElement("p");
             source.textContent = `Source: ${article.source.name || 'Unknown'}`;


            listItem.appendChild(link);
            listItem.appendChild(source);
            newsListElement.appendChild(listItem);
        });

        // Adaugam atribuirea obligatorie
        addNewsApiAttribution();
    }

     /**
     * Adauga link-ul de atribuire pentru NewsAPI.org
     */
     function addNewsApiAttribution() {
         if (!newsSection) return;

         // Verificam daca atribuirea exista deja
         if (document.getElementById('news-attribution')) return;

         const attribution = document.createElement('div');
         attribution.id = 'news-attribution';
         attribution.innerHTML = 'Powered by <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer">NewsAPI.org</a>';
         newsSection.appendChild(attribution);
     }

    // --- Initializare ---
    fetchWeatherNews(); // Apelam functia la incarcarea paginii
});