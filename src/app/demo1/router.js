import index from './pages/index.vue';

import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router)

export default new Router({
    // mode: 'history',
    routes: [{
        path: '/',
        component: index,
        meta: {
            index: 0,
            title: "wyulang@163.com"
        }
    }]
})
