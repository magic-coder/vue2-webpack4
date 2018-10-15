
import index from './pages/index.vue';
import money from './pages/money.vue';
import pdf from './pages/pdf.vue';

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
    },
    {
        path: '/money',
        component: money,
        meta: {
            index: 1,
            title: "数字虚拟键盘"
        }
    },
    {
        path: '/pdf',
        component: pdf,
        meta: {
            index: 1,
            title: "数字虚拟键盘"
        }
    }
    ]
})
