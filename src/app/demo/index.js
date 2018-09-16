import Vue from 'vue';
import App from './app.vue';
import router from './router.js';
// import MintUI from 'mint-ui';
// import store from '../../store';
// import gobal from '../../config/gobal';

Vue.config.productionTip = false;
// Vue.prototype.gobal=gobal;
// Vue.use(MintUI);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  // store,
  components: { App },
  template: '<App/>'
})


// document.getElementById('app').innerHTML="eeeedddee"

if (module.hot) {
  module.hot.accept();
}
