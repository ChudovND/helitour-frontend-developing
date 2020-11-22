import Vue from 'vue';
import Fuse from 'fuse.js';
import VueCurrencyFilter from 'vue-currency-filter';
import MaskedInput from 'vue-masked-input';
import DatePicker from 'vue2-datepicker';
import axios from 'axios';
import { webp, headerPopup, vhFix, selectItemInit } from './base';
// import { time } from 'modernizr';

webp();
headerPopup();
vhFix();
selectItemInit();

Vue.use(VueCurrencyFilter, {
  thousandsSeparator: ' ',
  fractionCount: 2,
  fractionSeparator: '.',
});

const fixedHelitour = document.getElementById('fixed-helitour')
const fixedPassengers = document.getElementById('fixed-passengers')
const fixedDuration = document.getElementById('fixed-duration')
const fixedPrice = document.getElementById('fixed-price')

const app = new Vue({
  el: '#app',
  components: {
    DatePicker, MaskedInput
  },
  data () {
    const date = new Date();
    return {
      validate: false,
      trip: null,
      passengers: null,
      helicopter: null,
      trips: [],
      helicopters: [],
      // price: 25000,
      present: false,
      date: `${('0'+date.getDate()).slice(-2)}.${('0'+(date.getMonth()+1)).slice(-2)}.${date.getFullYear()}`,
      time: '12:00',
      disabledDates: [],
      name: null,
      lastName: null,
      telephone: null,
      email: null,
      delivery: null,
      message: null,
      offerAccept: null,
      lang: {
        formatLocale: {
          months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
          monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
          weekdays: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
          weekdaysMin: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
          firstDayOfWeek: 1,
        },
        days: [],
        months: [],
      },
      deliveries: null,
      city: null,
      citySearch: null,
      cityFuse: null,
      cities: null,
      filteredCities: null,
      warehouse: null,
      warehouseSearch: null,
      warehouseFuse: null,
      filteredWarehouses: null,
      warehouses: null
    };
  },
  watch: {
    trip (v) {
      const maxP = Math.max.apply(null, this.helicopters.filter(({ id }) =>
        this.trips.find(trip => trip.id === v).helicopters.includes(id)
      ).map(({ passengers }) => passengers));
      if (this.passengers > maxP)
        this.passengers = 1
      const helics = this.helicopters.filter( ({ id, passengers }) =>
        this.trips.find(trip => trip.id === v).helicopters.includes(id) && this.passengers <= passengers
      ).map(({ id }) => id)
      if (!helics.includes(this.helicopter))
        this.helicopter = helics[0]
      if (v && fixedDuration) {
        fixedDuration.innerText = this.trips.find(({ id }) => id === v).duration + ' хв'
      }
    },
    passengers (v) {
      const helics = this.helicopters.filter( ({ id, passengers }) =>
        this.tripInfo.helicopters.includes(id) && v <= passengers
      ).map(({ id }) => id);
      if (!helics.includes(this.helicopter))
        this.helicopter = helics[0]
    },
    helicopter: {
      immediate: true,
      handler: function (v) {
        if (v) {
          // axios.get('./disabled_times.json')
          axios.get(`/api/booking/free-date.json?ID=${v}`)  
            .then(({ data: { disabledDates } }) => {
              this.disabledDates = [...disabledDates]
            })
          const helicopter = this.helicopters.find(({ id }) => id === v)
          if (fixedHelitour) {
            fixedHelitour.innerText = helicopter.name
          }
          if (fixedPassengers) {
            fixedPassengers.innerText = helicopter.text
          }
          if (fixedPrice) {
            fixedPrice.innerText = Math.round(this.price / helicopter.passengers) + 'грн'
          }
        }
      }
    },
    delivery () {
      this.cities = null;
      this.warehouse = null;
      this.warehouses = null;
      this.filteredCities = null;
      this.citySearch = null;
      this.warehouseSearch = null;
      this.filteredWarehouses = null;
      this.warehouseFuse = null;
    },
    city (v) {
      this.warehouse = null;
      if (v) {
        axios.post('/api/delivery/warehouse.json', { id: this.city }).then( ({ data: warehouses }) => {
        // axios.get('/warehouse.json').then( ({ data: warehouses }) => {
          // this.warehouses = warehouses.map(({ id: strId, text: name }, i) => ({ strId, name, id: i+1 }));
          this.warehouses = warehouses
          this.warehouseFuse = new Fuse(this.warehouses, { 
            keys: ['text'],
            threshold: 0.7,
          });
          this.filteredWarehouses = [...this.warehouses];
        } )
      } else {
        this.warehouses = null;
        this.warehouseSearch = null;
        this.filteredWarehouses = null;
        this.warehouseFuse = null;
        this.warehouse = null;
      }
    },
    citySearch (v) {
      if (this.cityName !== v) {
        this.city = null;
      }
      if (v) {
        axios.post('/api/delivery/city.json', { id: v }).then( ({ data: cities }) => {
        // axios.get('/city.json').then( ({ data: cities}) => {
          this.cities = cities;
          console.log(cities)
        })
      } else {
        this.cities = null;
        this.warehouse = null;
        this.warehouses = null;
        this.filteredCities = null;
        this.citySearch = null;
        this.warehouseSearch = null;
        this.filteredWarehouses = null;
        this.warehouseFuse = null;
      }      
    },
    warehouseSearch (v) {
      if (v) {
        this.filteredWarehouses = this.warehouseFuse.search(v).map(({ item }) => item);
      } else {
        this.filteredWarehouses = this.warehouses ? [...this.warehouses] : null;
      }
      
    }
  },
  computed: {
    isFormReady () {
      return this.trip && this.passengers && this.helicopter && (!this.present && this.date && this.time || this.present) && 
        this.name && this.lastName && this.telephone && this.offerAccept &&
        (!this.present || (this.present && this.delivery && (this.delivery === 1 || this.delivery === 2 && this.city && this.warehouse)));
    },
    tripInfo () {
      return this.trips.find(trip => trip.id === this.trip);
    },
    filteredHelicopters () {
      return this.helicopters.filter( ({ id, passengers }) =>
        this.tripInfo.helicopters.includes(id) && this.passengers <= passengers
      )
    },
    passengersMax () {
      return this.trip ? [
        ...Array(1 + Math.max(
          ...this.filteredHelicopters.map( ({ passengers }) =>
            passengers
          )
        )).keys()
      ].slice(1) : [];
    },
    deliveryName () {
      if (!this.deliveries) return null
      const d = this.deliveries.find(d => d.id === this.delivery)
      return d ? d.name : null;
    },
    cityName () {
      if (!this.cities) return null
      const c = this.cities.find(c => c.id === this.city)
      return c ? c.text : null;
    },
    warehouseName () {
      if (!this.warehouses) return null
      const w = this.warehouses.find(w => w.id === this.warehouse)
      return w ? w.text : null;
    },
    price () {
      const t = this.tripInfo
      return t.prices[t.helicopters.indexOf(this.helicopter)]
    }
  },
  methods: {
    cityClick (id) {
      this.city = id;
      this.citySearch = this.cityName;
    },
    warehouseClick (id) {
      this.warehouse = id;
      this.warehouseSearch = this.warehouseName;
    },
    checkFields () {
      this.validate = true
    },
    sendForm (isOnlinePayment, isFormUnready) {
      if (isFormUnready) {
        this.checkFields()
        return
      }
      console.log(isOnlinePayment)
      const data = JSON.stringify({
        tripId: this.trip,
        passengers: this.passengers,
        helicopterId: this.helicopter,
        date: this.date,
        time: this.time,
        present: this.present,
        name: this.name,
        lastName: this.lastName,
        telephone: this.telephone,
        email: this.email,
        message: this.message,
        deliveryId: this.delivery,
        city: this.city,
        warehouse: this.warehouse,
        isOnlinePayment: isOnlinePayment,
        partnerId: this.$refs.partnerId.value
      })
      axios.post('/api/booking.json', data)
        .then(({ data }) => {
          if (data.success) {
            window.location = data.location
          } else {
            alert(data.message)
          }
        })
        .catch(() => alert('Что-то пошло не так'))
    },
    disableDate (date) {
      const today = new Date();
      today.setHours(0,0,0,0);
      if (date < today) return true
      const disabledDates = this.disabledDates.filter(({ time }) => !time.length).map(({ date }) => date)
      if (disabledDates.findIndex(dateT => {
        const p = dateT.split('.');
        return p[0] == date.getDate() && p[1] == (date.getMonth() + 1) && p[2] == date.getFullYear();
      }) !== -1) return true
      return false
    },
    disableTime (date) {
      const dateP = this.date
      let timesForDate = this.disabledDates.find(({ date:dateT }) => dateP === dateT )
      console.log(timesForDate)
      if (timesForDate) { 
        timesForDate = timesForDate.time
      } else {
        return false
      }
      if (!timesForDate.length) {
        return true
      }
      const minutes = `${date.getMinutes() + 100}`.slice(1)
      if (timesForDate.includes(`${date.getHours()}:${minutes}`)) { 
        return true
      }
      return false
    }
  },
  async created () {
    const { data } = await axios.get('/helitours_info.json?lang='+document.querySelector('html').getAttribute('lang'));
    this.trips = [...data.trips];
    this.helicopters = [...data.helicopters];
    // this.disabledDates = [...data.disabledDates];
    this.deliveries = [...data.deliveryMethods];
    const tripMeta = document.querySelector('meta[name="tripId"]');
    const helicopterMeta = document.querySelector('meta[name="helicopterId"]');
    this.passengers = 1;
    if (tripMeta)
      this.trip = Number.parseInt(tripMeta.getAttribute('content'));
    else
      this.trip = this.trips[0].id;
    if (helicopterMeta)
      this.helicopter = Number.parseInt(helicopterMeta.getAttribute('content'));
    else
      this.helicopter = this.trips.find(({ id }) => id === this.trip).helicopters[0];
  },
});

window.addEventListener('scroll', () => {
  const controllerElement = document.getElementById('js__fixed-visible-controller');
  if (!controllerElement) return;
  const controllerLength = controllerElement.scrollHeight;
  const control = document.getElementById('js__fixed-visible-control');
  if (!control) return;
  if (window.pageYOffset >= controllerLength) {
    if (!control.classList.contains('active'))
      control.classList.add('active');
  } else {
    if (control.classList.contains('active'))
      control.classList.remove('active');
  }
}, { passive: true });