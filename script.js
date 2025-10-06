const cities = {
    citiesFound: [],
    getCitiesByName: async function getCitiesByName(cityName) {
        try {

            const geocodingAPIURL = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(cityName)}&addressdetails=1`;
            const coordsResponse = await fetch(geocodingAPIURL);

            if (!coordsResponse.ok) {
                console.error("Error fetching coordinates:", coordsResponse.statusText);
                return;
            }
            const cities = await coordsResponse.json();
            this.citiesFound = cities;
        } catch (err) {
            console.error("Error fetching cities:", err);
            errorLoadingState.setErrorPage();
        }
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

const errorLoadingState = {
    isAPIError: false,
    setErrorPage: function () {
        const mainContainer = document.querySelector("main");
        const errorPage = document.querySelector(".error-page");
        const retryBtn = errorPage.querySelector("#retry-btn");

        if (!mainContainer || !errorPage || !retryBtn) return;

        // Always show error page
        mainContainer.classList.add("hide");
        errorPage.classList.remove("hide");
        this.isAPIError = true;

        // Add listener only once
        if (!retryBtn.dataset.listenerAdded) {
            retryBtn.addEventListener("click", async () => {
                this.isAPIError = false;
                window.location.reload();
            });
            retryBtn.dataset.listenerAdded = "true";
        }
    }
}

const unitState = {
    isMetric: true,
    toggleUnit: function () {
        this.isMetric = !this.isMetric;
    },
}

document.addEventListener("DOMContentLoaded", () => {
    try {

        console.log("DOM fully loaded");
        {
            const unitSelector = document.querySelector(".unit-selector-menu");
            const unitMenuButton = unitSelector.querySelector("button");
            const precipitationUnitGroup = document.createElement("li");
            const UnitListContainer = document.createElement("ul");
            const toggleUnitsElement = document.createElement("li");
            const temperatureUnitGroup = document.createElement("li");
            const temperatureSubGroup = document.createElement("ul");
            const celsiusOption = document.createElement("li");
            const fahrenheitOption = document.createElement("li");
            const windSpeedUnitGroup = document.createElement("li");
            const windSpeedSubGroup = document.createElement("ul");
            const kmhOption = document.createElement("li");
            const mphOption = document.createElement("li");
            const precipitationSubGroup = document.createElement("ul");
            const mmOption = document.createElement("li");
            const inchOption = document.createElement("li");


            UnitListContainer.classList.add("unit-list");
            unitMenuButton.ariaExpanded = "false";

            unitMenuButton.addEventListener("click", (e) => {
                e.preventDefault();
                if (unitMenuButton.ariaExpanded === "true") {
                    unitMenuButton.ariaExpanded = "false";
                    UnitListContainer.classList.remove("show");
                } else {
                    unitMenuButton.ariaExpanded = "true";
                    UnitListContainer.classList.add("show");
                }
            });

            UnitListContainer.addEventListener("focusout", (e) => {
                unitMenuButton.ariaExpanded = "false";
                UnitListContainer.classList.remove("show");
            });

            /* Unit Toggle Control */
            toggleUnitsElement.textContent = unitState.isMetric ? "Switch to Imperial" : "Switch to Metric";
            toggleUnitsElement.tabIndex = -1;
            toggleUnitsElement.addEventListener("click", () => {
                unitState.toggleUnit();
                toggleUnitsElement.textContent = unitState.isMetric ? "Switch to Imperial" : "Switch to Metric";
                celsiusOption.classList.toggle("selected-option");
                fahrenheitOption.classList.toggle("selected-option");
                kmhOption.classList.toggle("selected-option");
                mphOption.classList.toggle("selected-option");
                mmOption.classList.toggle("selected-option");
                inchOption.classList.toggle("selected-option");
                unitMenuButton.ariaExpanded = !unitMenuButton.ariaExpanded;
                getCityWeather();
            });
            UnitListContainer.appendChild(toggleUnitsElement);


            /* temperature units option group */
            temperatureSubGroup.textContent = "Temperature";
            temperatureSubGroup.classList.add("sub-group");
            celsiusOption.textContent = "Celsius (°C)";
            if (unitState.isMetric) {
                celsiusOption.classList.add("selected-option");
            }
            celsiusOption.tabIndex = -1;
            fahrenheitOption.textContent = "Fahrenheit (°F)";
            fahrenheitOption.tabIndex = -1;
            if (!unitState.isMetric) {
                fahrenheitOption.classList.add("selected-option");
            }
            temperatureSubGroup.appendChild(celsiusOption);
            temperatureSubGroup.appendChild(fahrenheitOption);
            temperatureUnitGroup.appendChild(temperatureSubGroup);
            UnitListContainer.appendChild(temperatureUnitGroup);

            /* wind speed units option group */
            windSpeedSubGroup.textContent = "Wind Speed";
            windSpeedSubGroup.classList.add("sub-group");
            kmhOption.textContent = "km/h";
            kmhOption.tabIndex = -1;
            if (unitState.isMetric) {
                kmhOption.classList.add("selected-option");
            }

            mphOption.textContent = "mph";
            mphOption.tabIndex = -1;
            if (!unitState.isMetric) {
                mphOption.classList.add("selected-option");
            }
            windSpeedSubGroup.appendChild(kmhOption);
            windSpeedSubGroup.appendChild(mphOption);
            windSpeedUnitGroup.appendChild(windSpeedSubGroup);
            UnitListContainer.appendChild(windSpeedUnitGroup);

            /* precipitation units option group */
            precipitationSubGroup.textContent = "Precipitation";
            precipitationSubGroup.classList.add("sub-group");
            mmOption.textContent = "Millimeter (mm)";
            mmOption.tabIndex = -1;
            if (unitState.isMetric) {
                mmOption.classList.add("selected-option");
            }
            inchOption.textContent = "Inch (in)";
            inchOption.tabIndex = -1;
            if (!unitState.isMetric) {
                inchOption.classList.add("selected-option");
            }

            precipitationSubGroup.appendChild(mmOption);
            precipitationSubGroup.appendChild(inchOption);
            precipitationUnitGroup.appendChild(precipitationSubGroup);
            UnitListContainer.appendChild(precipitationUnitGroup);
            unitSelector.appendChild(UnitListContainer);
        }




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
                // console.log("Finding cities with name: ", cityName);
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
        getCityWeatherBtn.addEventListener("click", async () => {
            await getCityWeather();
        });
    } catch (err) {
        console.error("Error during DOMContentLoaded:", err);
    }
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
    const roundedLat = Math.round((Number(cities.selectedCity.lat) + Number.EPSILON) * 100) / 100;
    const roundedLong = Math.round((Number(cities.selectedCity.lon) + Number.EPSILON) * 100) / 100;

    const weatherParams = `&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=weather_code,temperature_2m&current=temperature_2m,wind_speed_10m,precipitation,apparent_temperature,weather_code,relative_humidity_2m,is_day&forecast_days=7&timezone=auto${unitState.isMetric ? "" : "&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch"}`;


    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLong}${weatherParams}`);

        if (!weatherRes.ok) {
            console.log(`Error fetching data: ${weatherRes.statusText}`);
            throw new Error("Failed to fetch weather data");
        }

        const weatherData = await weatherRes.json();

        weather.current = { values: weatherData.current, units: weatherData.current_units };
        weather.daily = { values: weatherData.daily, units: weatherData.daily_units };
        // weather.hourly = { values: weatherData.hourly, units: weatherData.hourly_units };
        for (let i = 0; i < weatherData.hourly.time.length; i += 24) {
            if (!weather.hourly) {
                weather.hourly = { values: { time: [], weather_code: [], temperature_2m: [] }, units: weatherData.hourly_units };
            }
            const singleDayHourlyTime = weatherData.hourly.time.slice(i, i + 24);
            const singleDayHourlyWeatherCode = weatherData.hourly.weather_code.slice(i, i + 24);
            const singleDayHourlyTemperature = weatherData.hourly.temperature_2m.slice(i, i + 24);
            weather.hourly.values.time.push(singleDayHourlyTime);
            weather.hourly.values.weather_code.push(singleDayHourlyWeatherCode);
            weather.hourly.values.temperature_2m.push(singleDayHourlyTemperature);
        }

        pageLoadingState.setIsLoading(false);
        setPageToLoading(pageLoadingState.isLoading);

        renderWeatherData();
    } catch (err) {
        console.error("Error fetching weather data:", err);
        errorLoadingState.setErrorPage();
    }
}


function renderWeatherData() {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Elements to be updated in current weather section on data fetch
    try {
        const currentLocationElement = document.querySelector("#location");
        const currentDateElement = document.querySelector("#forecast-day-date");
        const currentWeatherIconElement = document.querySelector("#weather-icon");
        const currentTemperature = document.querySelector("#current-temp");
        const currentperceivedTemperatureElement = document.querySelector("#perceived-temperature-value");
        const currentHumidityElement = document.querySelector("#humidity-value");
        const currentWindSpeedElement = document.querySelector("#wind-speed-value");
        const currentPrecipitationElement = document.querySelector("#precipitation-value");


        currentLocationElement.textContent = `${cities.selectedCity.address.city ?? cities.selectedCity.address.town ?? cities.selectedCity.address.municipality ?? cities.selectedCity.address.village ?? ""}, ${cities.selectedCity.address.country ?? ""}`;

        const currentDay = getFormattedDate(weather.current.values.time, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        // console.log("current day: ", currentDay);

        currentDateElement.textContent = `${currentDay}`;


        const currentWeatherIconMetaData = getWeatherIconURL(weather.current.values.weather_code, weather.current.values.is_day);

        currentWeatherIconElement.src = currentWeatherIconMetaData.iconURL;
        currentWeatherIconElement.alt = currentWeatherIconMetaData.altText;
        currentWeatherIconElement.title = currentWeatherIconMetaData.weatherCondition;
        currentTemperature.textContent = `${weather.current.values.temperature_2m}°`;

        currentperceivedTemperatureElement.textContent = `${weather.current.values.apparent_temperature}°`;
        currentHumidityElement.textContent = `${weather.current.values.relative_humidity_2m}${weather.current.units.relative_humidity_2m}`;
        currentWindSpeedElement.textContent = `${weather.current.values.wind_speed_10m} ${weather.current.units.wind_speed_10m}`;
        currentPrecipitationElement.textContent = `${weather.current.values.precipitation} ${weather.current.units.precipitation}`;

        /*------------------------------------------------------------------------------------------------------------------------------------------------------------ */
        // Elements to be updated in daily weather section on data fetch
        const dailyWeatherContainerList = document.querySelectorAll(".weekday-card");

        dailyWeatherContainerList.forEach((dayCard, index) => {
            // const dayElement = dayCard.children[0];
            const dayElement = document.createElement("span");
            const weatherIconElement = document.createElement("img");
            const maximumTempElement = document.createElement("span");
            const minimumTempElement = document.createElement("span");


            dailyWeatherContainerList[index].replaceChildren();
            dailyWeatherContainerList[index].appendChild(dayElement);
            dailyWeatherContainerList[index].appendChild(weatherIconElement);
            dailyWeatherContainerList[index].appendChild(maximumTempElement);
            dailyWeatherContainerList[index].appendChild(minimumTempElement);
            // rendered fetched data in components
            const dayDate = getFormattedDate(weather.daily.values.time[index], { weekday: 'short' });
            dayElement.textContent = `${dayDate}`;
            const dailyWeatherIconMetaData = getWeatherIconURL(weather.daily.values.weather_code[index], 1);
            weatherIconElement.src = dailyWeatherIconMetaData.iconURL;
            weatherIconElement.alt = dailyWeatherIconMetaData.altText;

            maximumTempElement.textContent = `${weather.daily.values.temperature_2m_max[index]}`;
            minimumTempElement.textContent = `${weather.daily.values.temperature_2m_min[index]}`;
        })

        /*------------------------------------------------------------------------------------------------------------------------------------------------------------ */
        // Elements to be updated in hourly weather section on data fetch

        const hourlyDaySelectElement = document.querySelector("#weekday-selector");
        const hourlyDayOptions = hourlyDaySelectElement.querySelectorAll("option");
        hourlyDayOptions.forEach((option, index) => {
            option.textContent = `${getFormattedDate(weather.hourly.values.time[index][0], { weekday: 'long' })}`;
        });


        renderedHourlyData(hourlyDaySelectElement);

        hourlyDaySelectElement.addEventListener("change", (e) => {
            renderedHourlyData(e.target);
        });

    }
    catch (err) {
        console.error("Error fetching weather data:", err);
    }
}


function renderedHourlyData(hourlyDaySelectElement) {
    const hourlyWeatherContainerList = document.querySelectorAll(".hourly-forecast-card");

    hourlyWeatherContainerList.forEach((hourCard, index) => {
        const timeElement = document.createElement("span");
        const weatherIconElement = document.createElement("img");
        const temperatureElement = document.createElement("span");

        hourlyWeatherContainerList[index].replaceChildren();
        hourlyWeatherContainerList[index].appendChild(timeElement);
        hourlyWeatherContainerList[index].appendChild(weatherIconElement);
        hourlyWeatherContainerList[index].appendChild(temperatureElement);

        // rendered fetched data in components

        const hourValue = weather.hourly.values.time[hourlyDaySelectElement.value][index].split("T")[1].split(":")[0];
        const formattedTime = getHoursBy12HourFormat(hourValue);
        timeElement.textContent = `${formattedTime.hour} ${formattedTime.period}`;

        const hourlyWeatherIconMetaData = getWeatherIconURL(weather.hourly.values.weather_code[hourlyDaySelectElement.value][index], (Number(hourValue) >= 6 && Number(hourValue) <= 18) ? 1 : 0);
        weatherIconElement.src = hourlyWeatherIconMetaData.iconURL;
        weatherIconElement.alt = hourlyWeatherIconMetaData.altText;
        weatherIconElement.title = hourlyWeatherIconMetaData.weatherCondition;
        temperatureElement.textContent = `${weather.hourly.values.temperature_2m[hourlyDaySelectElement.value][index]}°`;

    })
}


function setPageToLoading(indicator) {
    const currentWeatherSection = document.querySelector(".current-forecast");
    const dailyWeatherSection = document.querySelectorAll(".weekday-card");
    const hourlyWeatherSection = document.querySelectorAll(".hourly-forecast-card");



    if (indicator) {
        const currentWeatherSectionChildren = {
            bannerElement: currentWeatherSection.firstChild,
            metrics: []
        };
        const dailyWeatherSectionChildren = [];
        const hourlyWeatherSectionChildren = [];

        const metricsValueElement = currentWeatherSection.querySelectorAll("div:not(:first-child)>span:last-child");


        currentWeatherSectionChildren.metrics = [...metricsValueElement];

        const bannerOverlay = document.createElement("div");
        bannerOverlay.classList.add("forecast-banner-overlay");

        currentWeatherSectionChildren.bannerElement = currentWeatherSection.replaceChild(bannerOverlay, currentWeatherSection.firstElementChild);

        const loaderContainer = document.createElement("div");
        const svgSpan = document.createElement("span");
        for (let i = 0; i < 3; i++) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.style.height = '20px';
            svg.style.width = '20px';

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "50");
            circle.setAttribute("cy", "50");
            circle.setAttribute("r", "50");
            circle.setAttribute("fill", "var(--primary-300)");

            svg.appendChild(circle);
            svgSpan.appendChild(svg);
        }


        const textNode = document.createElement("span");

        textNode.textContent = "Loading...";
        textNode.style.fontSize = "calc(var(--font-size) * 1.2)";
        loaderContainer.classList.add("loader-container");

        loaderContainer.appendChild(svgSpan);
        bannerOverlay.appendChild(loaderContainer);
        bannerOverlay.appendChild(textNode);

        metricsValueElement.forEach((metric) => {
            metric.textContent = "—";
        });

        dailyWeatherSection.forEach((card) => {
            const children = Array.from(card.children);
            dailyWeatherSectionChildren.push(...children);
        });

        hourlyWeatherSection.forEach((card) => {
            const children = Array.from(card.children);
            hourlyWeatherSectionChildren.push(...children);
        });

        pageLoadingState.setActualChildren({
            currentWeatherSection: { ...currentWeatherSectionChildren },
            dailyWeatherSection: [...dailyWeatherSectionChildren],
            hourlyWeatherSection: [...hourlyWeatherSectionChildren]
        });
        console.log("Actual children set to: ", pageLoadingState.actualChildren);
    } else {


        pageLoadingState.setActualChildren(null);
    }
}

function getWeatherIconURL(weatherCode, isDay) {
    const result = {
        weatherCondition: "",
        iconURL: "",
        altText: ""
    }
    switch (true) {
        case (weatherCode === 0 || weatherCode === 1):
            if (isDay) {
                result.weatherCondition = "Clear sky";
                result.iconURL = "./assets/images/icon-sunny.webp";
                result.altText = "Clear sky during day";
            } else {
                result.weatherCondition = "Clear sky";
                result.iconURL = "./assets/images/icon-moon.png";
                result.altText = "Clear sky during night";
            }
            break;
        case weatherCode === 2:
            result.weatherCondition = "Partly cloudy";
            result.iconURL = "./assets/images/icon-partly-cloudy.webp";
            result.altText = "Partly cloudy";
            break;
        case (weatherCode === 3):
            result.weatherCondition = "Overcast";
            result.iconURL = "./assets/images/icon-overcast.webp";
            result.altText = "Overcast";
            break;
        case (weatherCode >= 45 && weatherCode <= 48):
            result.weatherCondition = "Fog";
            result.iconURL = "./assets/images/icon-fog.webp";
            result.altText = "Fog";
            break;
        case (weatherCode >= 51 && weatherCode <= 57):
            result.weatherCondition = "Drizzle";
            result.iconURL = "./assets/images/icon-drizzle.webp";
            result.altText = "Drizzle";
            break;
        case ((weatherCode >= 61 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)):
            result.weatherCondition = "Rain";
            result.iconURL = "./assets/images/icon-rain.webp";
            result.altText = "Rain";
            break;
        case ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)):
            result.weatherCondition = "Snow";
            result.iconURL = "./assets/images/icon-snow.webp";
            result.altText = "Snow";
            break;
        case (weatherCode >= 95 && weatherCode <= 99):
            result.weatherCondition = "Thunderstorm";
            result.iconURL = "./assets/images/icon-storm.webp";
            result.altText = "Thunderstorm";
            break;
        default:
            result.weatherCondition = "Unpredictable";
            result.iconURL = "./assets/images/icon-na.svg";
            result.altText = "Weather is Unpredictable";
            break;
    }
    return result;
}

function getHoursBy12HourFormat(hour) {
    const time = {
        hour: hour % 12 === 0 ? 12 : hour % 12,
        period: hour >= 12 ? "PM" : "AM"
    }
    return time;
}

function getFormattedDate(dateString, options, locale = undefined) {
    const date = new Intl.DateTimeFormat(locale, { timeZone: weather.timezone, ...options }).format(new Date(dateString));
    return date;
}

function updateUnitMenu() {
    const displayElement = document.createElement("option");
    displayElement.textContent = "Units"
}

function renderUnitSelectorMenu() {
    const unitSelector = document.querySelector(".unit-selector-menu");
    const unitMenuButton = unitSelector.querySelector("button");

    unitMenuButton.ariaExpanded = !unitMenuButton.ariaExpanded;
    UnitListContainer.classList.add("show");






    unitSelector.appendChild(UnitListContainer);
    const isExpanded = unitMenuButton.getAttribute("aria-expanded") === "true";
    unitMenuButton.setAttribute("aria-expanded", String(!isExpanded));

}