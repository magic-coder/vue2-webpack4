import Vue from 'vue';
import App from './app.vue';
import router from './router.js';

Vue.config.productionTip = false;

new Vue({
  el: '#app',
  router,
  // store,
  components: { App },
  template: '<App/>'
})


if (module.hot) {
  module.hot.accept();
}
