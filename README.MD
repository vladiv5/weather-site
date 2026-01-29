# Weather Viewer Application

## Description

This project is a modern, responsive weather dashboard built using vanilla JavaScript, HTML5, and CSS3. The application was designed to demonstrate proficiency in asynchronous programming, DOM manipulation, and third-party API integration, without relying on frontend frameworks.

Users can view real-time weather conditions, access detailed 5-day forecasts with visual charts, read curated weather-related news, and manage a persistent list of favorite cities using browser local storage.

---

## Features & Implementation

- **Real-Time Weather Data**
  - Integrated the WeatherAPI to retrieve current conditions and multi-day forecasts.
  - Implemented robust error handling using try/catch to gracefully manage invalid input and network failures.

- **Dynamic Visual Experience**
  - Integrated the Pexels API to dynamically load high-quality background images based on the selected city, improving user engagement.

- **Data Visualization**
  - Used Chart.js to render interactive line charts for temperature trends and bar charts for precipitation probability across forecast days.

- **Favorites Management**
  - Implemented a persistent favorites system using the browser Local Storage API.
  - Saved cities are displayed in a dashboard-style grid with live weather updates and persist across page reloads.

- **Geolocation Support**
  - Utilized the native Geolocation API to fetch weather data based on the user’s current coordinates with a single action.

- **Context-Aware Weather News**
  - Integrated NewsAPI to display relevant weather-related news.
  - Prioritized articles related to favorite cities, with a fallback to general weather headlines when no favorites are available.

---

## Application Flow

1. **Initialization**
   - On load, the application checks Local Storage for existing favorite cities.
   - The homepage is populated with predefined global cities to validate responsiveness and API availability.

2. **User Interaction**
   - Users search for a city manually or request location-based weather data via geolocation.

3. **Asynchronous Data Fetching**
   - Parallel API requests are performed (using `Promise.all` where applicable) to fetch weather data and background imagery.
   - A loading spinner provides visual feedback during data retrieval.

4. **Dynamic Rendering**
   - Weather data is rendered dynamically into the DOM.
   - Forecast charts are generated or updated when navigating to the detailed city view.

5. **Persistence**
   - Favorite cities are serialized and stored in Local Storage, ensuring data persistence across sessions.

---

## Project Structure

Weather-Viewer/
│
├── index.html                # Homepage (Dashboard & News)
├── city_weather.html         # Detailed forecast view
├── favorites.html            # Favorites grid view
├── about.html                # Project information
│
├── styles/
│   ├── global.css            # Global variables and CSS reset
│   ├── weather_cards.css     # Dashboard card styling
│   ├── spinner.css           # Loading indicator
│   └── ...
│
└── scripts/
    ├── index.js              # Homepage logic and News API integration
    ├── city_weather.js       # Forecast logic and chart rendering
    ├── favorites.js          # Local Storage management
    ├── global_search.js      # Shared search bar and geolocation logic
    └── weather_cards.js      # Dashboard card rendering logic

---

## Build & Run

This is a static web application and does not require a build step or backend server.

### How to run:
1. Clone the repository.
2. Open `index.html` in any modern web browser.

---

## Notes

- **Architecture**: A multi-page architecture was chosen to maintain semantic HTML structure and modular JavaScript logic.
- **Responsiveness**: The UI is fully responsive, implemented using CSS Grid and Flexbox for compatibility across mobile, tablet, and desktop devices.
- **API Key Handling**: API keys are included client-side for demonstration purposes. In a production environment, requests would be proxied through a backend service to secure sensitive credentials.
