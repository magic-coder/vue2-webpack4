import fly from 'flyio';
import env from './envConfig';
export class WebApi {
    constructor() {
        //拦截器,
        fly.interceptors.response.use(
            (response) => {
                //只将请求结果的data字段返回
                return response.data
            },
            (err) => {
                //发生网络错误后会走到这里
            }
        )
    }
    //请求主体
    request(url, data, method = 'post', json) {
        let contype = this.getHeader(json);
        return fly.request(url, data, {
            method: method,
            headers: contype
        })
    }
     /**
     * @desc get请注
     * @param json 当为对像时{isJson:是否为application/json} 当为string时（传值json）为application/json
     * @return type
     */
    getHeader(json) {
        let ctype = json == 'json' ? 'application/json' : 'application/x-www-form-urlencoded';
        if(json.isJson){
            ctype='application/json';
            delete json.isJson;
        }
        let headerObj={
            'Content-Type': ctype.toString()
        }
        if(typeof json==='object'){
            Object.assign(headerObj,json)
        }
        return headerObj;
    }
    /**
     * @desc get请注
     * @param url 请求URL地址
     * @param {data}  请求数据
     * @param type 请求环境，如 手机，微信，市场
     * @return type
     */
    get(url, data, type = '', json = '') {
        let getUrl = this.getDomainApi(type) + url;
        return this.request(getUrl, data, 'get', json);
    } /**
    * @desc get请注
    * @param url 请求URL地址
    * @param {data}  请求数据
    * @param type 请求环境，如 手机，微信，市场
    * @return type
    */
   post(url, data, type = '', json = '') {
       let getUrl = this.getDomainApi(type) + url;
       return this.request(getUrl, data, 'post', json);
   }
   getClient() {
       return "wechat";
   }
   getDomainApi(type) {
       let client = type || this.getClient();
       let url = '';
       switch (client) {
           case 'wechat':
               url = env.get('WechatServices');
               break;
           case 'app':
               url = env.get('AppServices');
               break;
           case 'mark':
               url = env.get('Marketervices');
               break;
           case 'viewlog':
               url = env.get('viewlogServer');
               break;
           default:
               url = env.get('WechatServices');
               break;
       }
       return url;
   }
}

export default WebApi;

