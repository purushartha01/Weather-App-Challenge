const cities = {
    citiesFound: [],
    getCitiesByName: async function getCitiesByName(cityName) {
        const geocodingAPIURL = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(cityName)}&addressdetails=1`;
        const coordsResponse = await fetch(geocodingAPIURL);
        if (!coordsResponse.ok) {
            console.error("Error fetching coordinates:", coordsResponse.statusText);
            return;
        }
        const cities = await coordsResponse.json();
        this.citiesFound = cities;
    },
    selectedCity: null
}

const weather = {
    current: null,
    daily: null,
    hourly: null,
}

const pageLoadingState = {
    isLoading: false,
    setIsLoading: function (state) {
        this.isLoading = state;
    },
    actualChildren: null,
    setActualChildren: function (children) {
        this.actualChildren = children;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");
    const cityNameInput = document.querySelector("#city-name");
    let timer;
    cityNameInput.addEventListener("input", async (e) => {
        clearTimeout(timer);
        if (e.target.value.length < 2) {
            return;
        }
        timer = setTimeout(async () => {
            const cityName = e.target.value.trim().toLowerCase();
            setSearchLoader();
            console.log("Finding cities with name: ", cityName);
            await cities.getCitiesByName(cityName);
            createCitySuggestionsList();
            clearTimeout(timer);
        }, 500);
    });

    let focussedCityIndex = -1;

    cityNameInput.addEventListener("keydown", (e) => {
        const suggestionsList = document.querySelector(".search-suggestions");
        const items = suggestionsList.querySelectorAll("li");
        if (suggestionsList.classList.contains("show")) {
            items.forEach(item => item.classList.remove("active"));
            switch (e.key) {
                case "ArrowDown":
                    // e.preventDefault();
                    e.stopPropagation();
                    if (items.length > 0 && focussedCityIndex < items.length - 1) {
                        focussedCityIndex += 1;
                    }
                    items[focussedCityIndex].classList.add("active");
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    e.stopPropagation();
                    if (items.length > 0 && focussedCityIndex > 0) {
                        focussedCityIndex -= 1;
                    }
                    items[focussedCityIndex].classList.add("active");
                    break;
                case "Enter":
                    e.preventDefault();
                    if (items.length > 0 && focussedCityIndex >= 0) {
                        items[focussedCityIndex].click();
                    }

                    break;
                case "Escape":
                    suggestionsList.classList.remove("show");
                    focussedCityIndex = -1;
                    break;
            }
            if (focussedCityIndex >= 0 && focussedCityIndex < items.length) {
                items[focussedCityIndex].scrollIntoView({ behavior: "auto", block: "nearest" });
            }
        }
    });

    const getCityWeatherBtn = document.querySelector("#get-city-weather");
    getCityWeatherBtn.addEventListener("click", getCityWeather);

});


async function setSearchLoader() {
    const suggestionsList = document.querySelector(".search-suggestions");
    if (!suggestionsList.classList.contains("show")) {
        suggestionsList.classList.add("show");
    }
    suggestionsList.replaceChildren();

    const noCityItem = document.createElement("li");
    const svgSpan = document.createElement("span");
    const svgFetchResponse = await fetch('./assets/images/icon-loading.svg');
    const svgText = await svgFetchResponse.text();
    svgSpan.innerHTML = svgText;

    svgSpan.style.animation = "rotate 1.5s linear infinite";


    const textNode = document.createElement("span");
    textNode.textContent = " Search in progress";
    noCityItem.appendChild(svgSpan);
    noCityItem.appendChild(textNode);
    suggestionsList.appendChild(noCityItem);

}


function createCitySuggestionsList() {
    const suggestionsList = document.querySelector(".search-suggestions");
    suggestionsList.classList.add("show");

    suggestionsList.replaceChildren();



    if (cities.citiesFound.length > 0) {
        cities.citiesFound.forEach(city => {
            const cityItem = document.createElement("li");

            const address = `${city.address.city ?? city.address.town ?? city.address.municipality ?? city.address.village ?? city.address.suburb ?? city.address.county ?? ""} ${(city.address.city || city.address.town || city.address.municipality || city.address.village || city.address.suburb || city.address.county) ? "," : ""} ${city.address.district ?? city.address.city_district ?? city.address.state_district ?? ""} ${(city.address.district || city.address.city_district || city.address.state_district) ? "," : ""} ${city.address.state ?? ""} ${(city.address.state) ? "," : ""} ${city.address.country ?? ""}`;

            cityItem.textContent = address;
            cityItem.tabIndex = -1;
            suggestionsList.appendChild(cityItem);
            cityItem.addEventListener("click", (e) => {
                cities.selectedCity = city;
                document.querySelector("#city-name").value = e.target.textContent;
                suggestionsList.classList.remove("show");
                document.querySelector("#city-name").focus();
            });
        });
    } else {
        const noCityItem = document.createElement("li");
        noCityItem.textContent = "No cities found";
        suggestionsList.appendChild(noCityItem);
    }
}



async function getCityWeather() {
    if (!cities.selectedCity) {
        return;
    }
    pageLoadingState.setIsLoading(true);
    setPageToLoading(pageLoadingState.isLoading);
    try {
        const roundedLat = Math.round((Number(cities.selectedCity.lat) + Number.EPSILON) * 100) / 100;
        const roundedLong = Math.round((Number(cities.selectedCity.lon) + Number.EPSILON) * 100) / 100;

        const weatherParams = `&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=weather_code,temperature_2m&current=temperature_2m,wind_speed_10m,precipitation,apparent_temperature,weather_code,relative_humidity_2m,is_day&timezone=auto`;

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLong}${weatherParams}`);

        const weatherData = await weatherRes.json();

        // RESPONSE_OBJECT = 
        // {
        //     "latitude": 29.25,
        //     "longitude": 79,
        //     "generationtime_ms": 0.3573894500732422,
        //     "utc_offset_seconds": 19800,
        //     "timezone": "Asia/Kolkata",
        //     "timezone_abbreviation": "GMT+5:30",
        //     "elevation": 237,
        //     "current_units": {
        //         "time": "iso8601",
        //         "interval": "seconds",
        //         "temperature_2m": "°C",
        //         "wind_speed_10m": "km/h",
        //         "precipitation": "mm",
        //         "apparent_temperature": "°C",
        //         "weather_code": "wmo code",
        //         "relative_humidity_2m": "%",
        //         "is_day": ""
        //     },
        //     "current": {
        //         "time": "2025-10-04T02:15",
        //         "interval": 900,
        //         "temperature_2m": 24.6,
        //         "wind_speed_10m": 2.3,
        //         "precipitation": 0,
        //         "apparent_temperature": 30,
        //         "weather_code": 1,
        //         "relative_humidity_2m": 92,
        //         "is_day": 0
        //     },
        //     "hourly_units": {
        //         "time": "iso8601",
        //         "weather_code": "wmo code",
        //         "temperature_2m": "°C"
        //     },
        //     "hourly": {
        //         "time": [
        //             "2025-10-04T00:00",
        //             "2025-10-04T01:00",
        //             "2025-10-04T02:00",
        //             "2025-10-04T03:00",
        //             "2025-10-04T04:00",
        //             "2025-10-04T05:00",
        //             "2025-10-04T06:00",
        //             "2025-10-04T07:00",
        //             "2025-10-04T08:00",
        //             "2025-10-04T09:00",
        //             "2025-10-04T10:00",
        //             "2025-10-04T11:00",
        //             "2025-10-04T12:00",
        //             "2025-10-04T13:00",
        //             "2025-10-04T14:00",
        //             "2025-10-04T15:00",
        //             "2025-10-04T16:00",
        //             "2025-10-04T17:00",
        //             "2025-10-04T18:00",
        //             "2025-10-04T19:00",
        //             "2025-10-04T20:00",
        //             "2025-10-04T21:00",
        //             "2025-10-04T22:00",
        //             "2025-10-04T23:00",
        //             "2025-10-05T00:00",
        //             "2025-10-05T01:00",
        //             "2025-10-05T02:00",
        //             "2025-10-05T03:00",
        //             "2025-10-05T04:00",
        //             "2025-10-05T05:00",
        //             "2025-10-05T06:00",
        //             "2025-10-05T07:00",
        //             "2025-10-05T08:00",
        //             "2025-10-05T09:00",
        //             "2025-10-05T10:00",
        //             "2025-10-05T11:00",
        //             "2025-10-05T12:00",
        //             "2025-10-05T13:00",
        //             "2025-10-05T14:00",
        //             "2025-10-05T15:00",
        //             "2025-10-05T16:00",
        //             "2025-10-05T17:00",
        //             "2025-10-05T18:00",
        //             "2025-10-05T19:00",
        //             "2025-10-05T20:00",
        //             "2025-10-05T21:00",
        //             "2025-10-05T22:00",
        //             "2025-10-05T23:00",
        //             "2025-10-06T00:00",
        //             "2025-10-06T01:00",
        //             "2025-10-06T02:00",
        //             "2025-10-06T03:00",
        //             "2025-10-06T04:00",
        //             "2025-10-06T05:00",
        //             "2025-10-06T06:00",
        //             "2025-10-06T07:00",
        //             "2025-10-06T08:00",
        //             "2025-10-06T09:00",
        //             "2025-10-06T10:00",
        //             "2025-10-06T11:00",
        //             "2025-10-06T12:00",
        //             "2025-10-06T13:00",
        //             "2025-10-06T14:00",
        //             "2025-10-06T15:00",
        //             "2025-10-06T16:00",
        //             "2025-10-06T17:00",
        //             "2025-10-06T18:00",
        //             "2025-10-06T19:00",
        //             "2025-10-06T20:00",
        //             "2025-10-06T21:00",
        //             "2025-10-06T22:00",
        //             "2025-10-06T23:00",
        //             "2025-10-07T00:00",
        //             "2025-10-07T01:00",
        //             "2025-10-07T02:00",
        //             "2025-10-07T03:00",
        //             "2025-10-07T04:00",
        //             "2025-10-07T05:00",
        //             "2025-10-07T06:00",
        //             "2025-10-07T07:00",
        //             "2025-10-07T08:00",
        //             "2025-10-07T09:00",
        //             "2025-10-07T10:00",
        //             "2025-10-07T11:00",
        //             "2025-10-07T12:00",
        //             "2025-10-07T13:00",
        //             "2025-10-07T14:00",
        //             "2025-10-07T15:00",
        //             "2025-10-07T16:00",
        //             "2025-10-07T17:00",
        //             "2025-10-07T18:00",
        //             "2025-10-07T19:00",
        //             "2025-10-07T20:00",
        //             "2025-10-07T21:00",
        //             "2025-10-07T22:00",
        //             "2025-10-07T23:00",
        //             "2025-10-08T00:00",
        //             "2025-10-08T01:00",
        //             "2025-10-08T02:00",
        //             "2025-10-08T03:00",
        //             "2025-10-08T04:00",
        //             "2025-10-08T05:00",
        //             "2025-10-08T06:00",
        //             "2025-10-08T07:00",
        //             "2025-10-08T08:00",
        //             "2025-10-08T09:00",
        //             "2025-10-08T10:00",
        //             "2025-10-08T11:00",
        //             "2025-10-08T12:00",
        //             "2025-10-08T13:00",
        //             "2025-10-08T14:00",
        //             "2025-10-08T15:00",
        //             "2025-10-08T16:00",
        //             "2025-10-08T17:00",
        //             "2025-10-08T18:00",
        //             "2025-10-08T19:00",
        //             "2025-10-08T20:00",
        //             "2025-10-08T21:00",
        //             "2025-10-08T22:00",
        //             "2025-10-08T23:00",
        //             "2025-10-09T00:00",
        //             "2025-10-09T01:00",
        //             "2025-10-09T02:00",
        //             "2025-10-09T03:00",
        //             "2025-10-09T04:00",
        //             "2025-10-09T05:00",
        //             "2025-10-09T06:00",
        //             "2025-10-09T07:00",
        //             "2025-10-09T08:00",
        //             "2025-10-09T09:00",
        //             "2025-10-09T10:00",
        //             "2025-10-09T11:00",
        //             "2025-10-09T12:00",
        //             "2025-10-09T13:00",
        //             "2025-10-09T14:00",
        //             "2025-10-09T15:00",
        //             "2025-10-09T16:00",
        //             "2025-10-09T17:00",
        //             "2025-10-09T18:00",
        //             "2025-10-09T19:00",
        //             "2025-10-09T20:00",
        //             "2025-10-09T21:00",
        //             "2025-10-09T22:00",
        //             "2025-10-09T23:00",
        //             "2025-10-10T00:00",
        //             "2025-10-10T01:00",
        //             "2025-10-10T02:00",
        //             "2025-10-10T03:00",
        //             "2025-10-10T04:00",
        //             "2025-10-10T05:00",
        //             "2025-10-10T06:00",
        //             "2025-10-10T07:00",
        //             "2025-10-10T08:00",
        //             "2025-10-10T09:00",
        //             "2025-10-10T10:00",
        //             "2025-10-10T11:00",
        //             "2025-10-10T12:00",
        //             "2025-10-10T13:00",
        //             "2025-10-10T14:00",
        //             "2025-10-10T15:00",
        //             "2025-10-10T16:00",
        //             "2025-10-10T17:00",
        //             "2025-10-10T18:00",
        //             "2025-10-10T19:00",
        //             "2025-10-10T20:00",
        //             "2025-10-10T21:00",
        //             "2025-10-10T22:00",
        //             "2025-10-10T23:00"
        //         ],
        //         "weather_code": [
        //             80,
        //             1,
        //             0,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             1,
        //             0,
        //             0,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             1,
        //             2,
        //             3,
        //             2,
        //             3,
        //             3,
        //             80,
        //             3,
        //             3,
        //             3,
        //             3,
        //             3,
        //             3,
        //             3,
        //             2,
        //             95,
        //             95,
        //             95,
        //             95,
        //             95,
        //             95,
        //             95,
        //             95,
        //             95,
        //             80,
        //             80,
        //             80,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             0,
        //             0,
        //             0,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0,
        //             0,
        //             0,
        //             0,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             2,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             1,
        //             0,
        //             0,
        //             0
        //         ],
        //         "temperature_2m": [
        //             25.2,
        //             25,
        //             24.6,
        //             24.1,
        //             23.8,
        //             23.7,
        //             23.6,
        //             24.8,
        //             26.5,
        //             28.1,
        //             29.7,
        //             31.1,
        //             32.1,
        //             32.5,
        //             32.4,
        //             32,
        //             31.2,
        //             29.5,
        //             27.7,
        //             26.7,
        //             25.9,
        //             25.3,
        //             24.9,
        //             24.8,
        //             24.8,
        //             23.8,
        //             23.2,
        //             22.9,
        //             22.5,
        //             22.3,
        //             22.2,
        //             23.4,
        //             25.3,
        //             27.1,
        //             28.7,
        //             30.1,
        //             31.2,
        //             31.9,
        //             32.1,
        //             31.9,
        //             30.9,
        //             28.9,
        //             27,
        //             26,
        //             25.4,
        //             24.8,
        //             24.4,
        //             24.4,
        //             24.1,
        //             23,
        //             23,
        //             22.8,
        //             22.6,
        //             22.5,
        //             22.6,
        //             24.1,
        //             26.2,
        //             27.7,
        //             28.9,
        //             29.8,
        //             30.4,
        //             30.5,
        //             29.8,
        //             28.6,
        //             27.7,
        //             26.8,
        //             26,
        //             25.7,
        //             25.6,
        //             25.2,
        //             25,
        //             24.9,
        //             24.6,
        //             24.4,
        //             24,
        //             23.5,
        //             22.8,
        //             22.3,
        //             22,
        //             21.8,
        //             21.9,
        //             22.3,
        //             22.9,
        //             23.7,
        //             25,
        //             26.5,
        //             27.5,
        //             27.6,
        //             27.2,
        //             26.5,
        //             25.7,
        //             24.8,
        //             23.9,
        //             23.4,
        //             23,
        //             22.7,
        //             22.3,
        //             22,
        //             21.8,
        //             21.5,
        //             21.2,
        //             21.3,
        //             21.8,
        //             22.6,
        //             23.6,
        //             25,
        //             26.6,
        //             27.8,
        //             28.5,
        //             28.8,
        //             28.8,
        //             28.3,
        //             27.6,
        //             26.7,
        //             25.8,
        //             24.7,
        //             23.8,
        //             23.1,
        //             22.6,
        //             22.2,
        //             21.8,
        //             21.4,
        //             21.1,
        //             20.7,
        //             20.3,
        //             20.2,
        //             20.7,
        //             21.5,
        //             22.5,
        //             24,
        //             25.8,
        //             27.3,
        //             28.2,
        //             28.7,
        //             28.8,
        //             28.2,
        //             27.1,
        //             26.1,
        //             25.1,
        //             24.1,
        //             23.2,
        //             22.6,
        //             22.1,
        //             21.6,
        //             21.2,
        //             20.8,
        //             20.5,
        //             20.2,
        //             19.9,
        //             19.9,
        //             20.4,
        //             21.2,
        //             22.2,
        //             23.7,
        //             25.4,
        //             26.8,
        //             27.8,
        //             28.5,
        //             28.7,
        //             28.3,
        //             27.4,
        //             26.4,
        //             25.4,
        //             24.2,
        //             23.3,
        //             22.7,
        //             22.2,
        //             21.8
        //         ]
        //     },
        //     "daily_units": {
        //         "time": "iso8601",
        //         "weather_code": "wmo code",
        //         "temperature_2m_max": "°C",
        //         "temperature_2m_min": "°C"
        //     },
        //     "daily": {
        //         "time": [
        //             "2025-10-04",
        //             "2025-10-05",
        //             "2025-10-06",
        //             "2025-10-07",
        //             "2025-10-08",
        //             "2025-10-09",
        //             "2025-10-10"
        //         ],
        //         "weather_code": [
        //             80,
        //             1,
        //             80,
        //             95,
        //             2,
        //             2,
        //             2
        //         ],
        //         "temperature_2m_max": [
        //             32.5,
        //             32.1,
        //             30.5,
        //             27.6,
        //             28.8,
        //             28.8,
        //             28.7
        //         ],
        //         "temperature_2m_min": [
        //             23.6,
        //             22.2,
        //             22.5,
        //             21.8,
        //             21.2,
        //             20.2,
        //             19.9
        //         ]
        //     }
        // };

        weather.current = { values: weatherData.current, units: weatherData.current_units };
        weather.daily = { values: weatherData.daily, units: weatherData.daily_units };
        weather.hourly = { values: weatherData.hourly, units: weatherData.hourly_units };
        console.log("Weather Object:", weather);
        renderWeatherData();

    } catch (err) {
        console.error("Error fetching weather data:", err);
    } finally {
        pageLoadingState.setIsLoading(false);
        setPageToLoading(pageLoadingState.isLoading);
    }
}


function renderWeatherData() {

    // Elements to be updated in current weather section on data fetch
    const currentLocationElement = document.querySelector("#location");
    const currentWeatherIconElement = document.querySelector("#current-weather-icon");
    const currentperceivedTemperatureElement = document.querySelector("#perceived-temperature-value");
    const currentHumidityElement = document.querySelector("#humidity-value");
    const currentWindSpeedElement = document.querySelector("#wind-speed-value");
    const currentPrecipitationElement = document.querySelector("#precipitation-value");

    currentLocationElement.textContent = `${cities.selectedCity.address.city ?? cities.selectedCity.address.town ?? cities.selectedCity.address.municipality ?? cities.selectedCity.address.village ?? ""}, ${cities.selectedCity.address.country ?? ""}`;




    // Elements to be updated in daily weather section on data fetch
    const dailyWeatherContainerList = document.querySelectorAll(".weekday-card");
    dailyWeatherContainerList.forEach((dayCard, index) => {
        const maximumTempElement = dayCard.children[0];
        const weatherIconElement = dayCard.children[1];
        const minimumTempElement = dayCard.children[2];

        // rendered fetched data in components

    })


    // Elements to be updated in hourly weather section on data fetch
    const hourlyWeatherContainerList = document.querySelectorAll(".hourly-forecast-card");
    hourlyWeatherContainerList.forEach((hourCard, index) => {
        const weatherIconElement = hourCard.children[0];
        const timeElement = hourCard.children[1];
        const temperatureElement = hourCard.children[2];
    })

}



function setPageToLoading(indicator) {
    const currentWeatherSection = document.querySelector(".current-forecast");
    const dailyWeatherSection = document.querySelector(".daywise-forecast");
    const hourlyWeatherSection = document.querySelector(".hourly-forecast");



    if (indicator) {
        const currentWeatherSectionChildren = currentWeatherSection.children;
        const dailyWeatherSectionChildren = dailyWeatherSection.children;
        const hourlyWeatherSectionChildren = hourlyWeatherSection.children;
        pageLoadingState.setActualChildren({
            currentWeatherSection: [...currentWeatherSectionChildren],
            dailyWeatherSection: [...dailyWeatherSectionChildren],
            hourlyWeatherSection: [...hourlyWeatherSectionChildren]
        });
        currentWeatherSection.replaceChildren("Loading...");
        dailyWeatherSection.replaceChildren("Loading...");
        hourlyWeatherSection.replaceChildren("Loading...");
    } else {
        currentWeatherSection.replaceChildren(...pageLoadingState.actualChildren.currentWeatherSection);
        dailyWeatherSection.replaceChildren(...pageLoadingState.actualChildren.dailyWeatherSection);
        hourlyWeatherSection.replaceChildren(...pageLoadingState.actualChildren.hourlyWeatherSection);
        pageLoadingState.setActualChildren(null);
    }
}

function getWeatherIconURL(weatherCode, isDay) {
    switch(weatherCode){
        

    }
}