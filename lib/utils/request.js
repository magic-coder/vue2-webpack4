import axios from 'axios';
import merge from './merge';
export const request = function (method = 'get') {
    return function (url, data = {}, config = {}) {
        const axiosConfig = merge(true, {}, { url, method, data }, config);
        return axios.request(axiosConfig);
    };
};
export default function () {
    const GET = request('get');
    const POST = request('post');
    const PUT = request('put');
    const DELETE = request('delete');
    return {
        GET, POST, PUT, DELETE
    };
}
