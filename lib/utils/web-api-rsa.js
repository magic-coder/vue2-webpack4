import { signatureReqParam } from './signature';
import WebApi from './web-api';
import { rsaPublicKey } from './config';
export default class WebApiRsa extends WebApi {
    /**
     * POST请求
     * @param  {String}   url    可选参数
     * @param  {Object}   data   必选，发送的数据对象
     * @param  {Object|Function}   config 必选如果是函数直接当成dto，否则当成配置对象，对象里面可以包含dto对象，和其他属性
     * @return {Promise} standard promise
     */
    $requestPost(url, data = {}, config = {}) {
        const inputData = this.$adjustParameter(url, data, config);
        return this.$request('POST', inputData.url, this.$signParams(inputData.data), { config: inputData.config, dto: inputData.dto });
    }
    // override on your app production
    $getRsaPublicKey() {
        return rsaPublicKey;
    }
    $signParams(finalReqData) {
        const reqParam = finalReqData.param;
        finalReqData.protocol = this.$merge(true, finalReqData.protocol, {
            signature: signatureReqParam(this.$getRsaPublicKey(), reqParam),
        });
        return finalReqData;
    }
}
