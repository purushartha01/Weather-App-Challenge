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
        console.log(cities);
        this.citiesFound = cities;
    },
    selectedCity: null
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
    // getCityWeatherBtn.addEventListener("click", getCityWeather);

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
            cityItem.textContent = city.display_name;
            cityItem.tabIndex = -1;
            suggestionsList.appendChild(cityItem);
            cityItem.addEventListener("click", (e) => {
                cities.selectedCity = city;
                document.querySelector("#city-name").value = city.display_name;
                suggestionsList.classList.remove("show");
                document.querySelector("#city-name").focus();
                console.log("Selected city:", cities.selectedCity);
            });
        });
    } else {
        const noCityItem = document.createElement("li");
        noCityItem.textContent = "No cities found";
        suggestionsList.appendChild(noCityItem);
    }
}