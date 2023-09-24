"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btn = document.querySelector(".btn");

class Workout {
  #date = new Date();
  _id = (Date.now() + " ").slice(-5);
  constructor(coords, distance, duration) {
    this.coords = coords; //in [lat,lng]
    this.distance = distance; //in meters
    this.duration = duration; //in minutes
  }
  _setDescription() {
    // prettier-ignore
    const months = [ "January","February", "March","April","May","June","July","August","September","October","November","December"];
    this.desciption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.#date.getMonth()]
    } ${this.#date.getDate()}`;
    return this.desciption;
  }
}
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calpace();
    this._setDescription();
  }
  calpace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation = 0) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._calspeed();
    this._setDescription();
  }
  _calspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workoutarray = [];
  constructor() {
    // loading of position
    this._getPosition();
    // getting the local storage
    this._getLocalStorage();
    //  form subbmission and then rendring the coordinates on map
    form.addEventListener("submit", this._newWorkout.bind(this));
    // toggling between different selections
    inputType.addEventListener("change", this._toggleEventionField);
    // for moving the clicks on lists on map
    containerWorkouts.addEventListener(
      "click",
      this._moveToPosition.bind(this)
    );
    // add event listner on the button
    btn.addEventListener("click", this.reset.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._load.bind(this),
        function () {
          alert("Your location not found");
        }
      );
    }
  }
  _load(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // handling click on map
    this.#map.on("click", this._showform.bind(this));
    this.#workoutarray.forEach((data) => {
      this._rendaronMap(data);
    });
  }
  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideform() {
    // make the form empty
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    // hide the form once submitted
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(function () {
      form.style.display = "grid";
    }, 1000);
  }
  _toggleEventionField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkout(e) {
    e.preventDefault();
    const inputvalidity = (...input) =>
      input.every((inp) => Number.isFinite(inp));
    const positivecheck = (...input) => input.every((inp) => inp > 0);
    // Get the data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workouts;
    //  if workout is running,create running object
    if (type === "running") {
      const cadance = +inputCadence.value;
      //  if data is valid
      if (
        !inputvalidity(distance, duration, cadance) ||
        !positivecheck(distance, duration, cadance)
      )
        return alert("The number should be positive");
      workouts = new Running([lat, lng], distance, duration, cadance);
    }

    // if workout is cycling ,create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      //  if data is valid
      if (
        !inputvalidity(distance, duration, elevation) ||
        !positivecheck(distance, duration)
      )
        return alert("The number should be positive");
      workouts = new Cycling([lat, lng], distance, duration, elevation);
    }
    //  add a new object to the workout array
    this.#workoutarray.push(workouts);

    //  rendaring the latitude and longitude on the map
    this._rendaronMap(workouts);

    // render it on the list
    this._renderonList(workouts);
    // hide the form once submitted
    this._hideform();
    //  add all the items of workout array to local storage
    this._setLocalStorage();
  }
  _renderonList(workout) {
    let html = ` <li class="workout workout--${workout.type}" data-id="${
      workout._id
    }">
    <h2 class="workout__title">${workout.desciption}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === "running") {
      html += `  <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadance}</span>
      <span class="workout__unit">spm</span>
     
    </div>
  </li>`;
    }
    if (workout.type === "cycling") {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
     
      </div>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _rendaronMap(workouts) {
    L.marker(workouts.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workouts.type}-popup`,
        })
      )
      .setPopupContent(
        `${workouts.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
          workouts.desciption + " "
        }`
      )
      .openPopup();
  }
  _moveToPosition(e) {
    const workele = e.target.closest(".workout");

    if (!workele) return; //gaurd clause
    const workout = this.#workoutarray.find(
      (work) => work._id === workele.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // console.log(workout);
  }
  _setLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workoutarray));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));
    if (!data) return;
    // taking all the initial data in the array and then rendaring it on map
    this.#workoutarray = data;
    this.#workoutarray.forEach((data) => {
      this._renderonList(data);
    });
  }
  reset() {
    localStorage.removeItem("workout");
    location.reload();
  }
}
const app = new App();
