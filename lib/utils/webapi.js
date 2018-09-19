import * as lang from './lang';
import promisify from './promisify';
import H5web from './request'
import merge from './merge';
const apiDefaultConfig = {
	// https://github.com/mzabriskie/axios
	// `headers` are custom headers to be sent
	headers: { 'X-Requested-With': 'XMLHttpRequest' },
	withCredentials: false,
	// `responseType` indicates the type of data that the server will respond with
	// options are 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
	responseType: 'json',
	// `xsrfCookieName` is the name of the cookie to use as a value for xsrf token
	xsrfCookieName: 'XSRF-TOKEN',
	// `xsrfHeaderName` is the name of the http header that carries the xsrf token value
	xsrfHeaderName: 'X-XSRF-TOKEN' // default
};
class WebApi {
	constructor(baseData = {}, config = {}) {
		this.$merge = merge;
		this.$requestService = H5web();
		this.$monitorService = null;
		/**
		 * @desc 拦截器, 可以在这里写对应的拦截器，当然也可以在子类override掉
		 * @param {Object} options {resolve: callback}
		 * @param {Result} result 服务器API返回的真实数据
		 * @return 必须实现options.fail|success的回调
		 */
		this.$interceptorDto = ({ resolve, ...options }, result) => {
			if (lang.isObject(this.$monitorService) && lang.isFunction(this.$monitorService.interceptor)) {
				this.$monitorService.interceptor.call(this, options, result);
			}
			// axios [configs, headers,request,status, statusText]
			resolve(result.data);
		};
		/**
		 * @desc 拦截器, 可以在这里写对应的拦截器，当然也可以在子类override掉
		 * @param {Object} options {resolve: callback}
		 * @param {Result} result 服务器API返回的Exception的时候真实数据
		 * @return 必须实现options.fail|success的回调
		 */
		this.$interceptorExceptionDto = ({ resolve, ...options }, err) => {
			if (lang.isObject(this.$monitorService) && lang.isFunction(this.$monitorService.interceptorException)) {
				this.$monitorService.interceptorException.call(this, options, err);
			}
			resolve(err);
		};
		/**
		 * http request exception handling, don't override this method.
		 * @private
		 */
		this.$requestErrorHandler = (inputData) => (catchErr) => {
			return promisify(this.$interceptorExceptionDto)({ requestData: inputData }, catchErr)
				.then((err) => { throw err; });
		};
		this.$baseData = baseData;
		this.$apiConfig = merge(true, {}, apiDefaultConfig, config);
	}
	/**
	 * Allow us set customized request service.
	 *
	 * @param {service} requestService implement request.js/request interface.
	 */
	$setRequestService(requestService) {
		this.$requestService = requestService;
	}
	/**
	 *  Allow us set customized request service.
	 * @param {service} monitorService
	 */
	$setMonitorService(monitorService) {
		this.$monitorService = monitorService;
	}
	$getDomainApi() {
		throw new Error('please override `getDomainApi()` in your service');
	}
	$bind(fn, context = this, ...extraArgs) {
		return fn.bind ? fn.bind(context, ...extraArgs) : (...args) => fn.call(context, ...extraArgs, ...args);
	}
	$assertion(field, message, checker) {
		let checkValue = field;
		if (lang.isFunction(checker)) {
			checkValue = checker(field);
		}
		if (checkValue === false) {
			throw new Error(message);
		}
	}
	/**
	 * http request post
	 * @param {String|Object} url optional <string> indicates request url, <object> indicates requestData it's parameter migration
	 * @param {Object} data required request data
	 * @param {Object} config optional
	 */
	$requestPost(url, data = {}, config = {}) {
		return this.$request('POST', url, data, config);
	}
	$requestGet(url, data = {}, config = {}) {
		return this.$request('GET', url, data, config);
	}
	$promiseResult(data) {
		return promisify(({ resolve }) => resolve(data))({});
	}
	$preRequest(inputData) {
		return this.$promiseResult(inputData);
	}
	$request(method, url, data = {}, config = {}) {
		const inputRawData = this.$adjustParameter(url, data, config);
		return this.$preRequest(inputRawData).then((inputData) => {
			this.$assertion(inputData, '$request() http `inputData.url` must be providered!', (checkData) => lang.isObject(checkData) && lang.isString(checkData.url));
			return this.$requestService[method](inputData.url, inputData.data, inputData.config).then((result) => {
				return promisify(this.$interceptorDto)({ requestData: inputData }, result)
					.then((newResult) => {
						// 自定义WEBAPI拦截器
						return inputData.dto.call(this, newResult);
					});
			});
		}).catch(this.$requestErrorHandler(inputRawData));
	}
	/**
	 * POST请求
	 * @author tianyingchun
	 * @param  {String}   url    可选参数
	 * @param  {Object}   data   必选，发送的数据对象
	 * @param  {Object|Function}   config 必选如果是函数直接当成dto，否则当成配置对象，对象里面可以包含dto对象，和其他属性
	 * @return {Object} 转换之后的参数: {url, data, dto, config}.
	 */
	$adjustParameter(url, data = {}, config) {
		if (lang.isPlainObject(url)) {
			config = data;
			data = url;
			url = this.$getDomainApi() + url.protocol.action + '/' + url.protocol.functionCode;
		}
		let dto = function baseDefaultDto(result) {
			return result;
		};
		if (lang.isFunction(config)) {
			dto = config;
			config = {};
		}
		else if (lang.isPlainObject(config)) {
			if (lang.isFunction(config.dto)) {
				dto = config.dto;
				delete config.dto;
			}
		}
		else {
			config = {};
		}
		config = merge(true, {}, this.$apiConfig, config);
		return { url, data, dto, config };
	}
	$getReqData(functionCode, data) {
		const protocol = this.$getProtocol(functionCode);
		const reqParam = merge(true, {}, this.$baseData, data);
		const finalReqData = merge(true, protocol, {
			param: reqParam
		});
		return finalReqData;
	}
	$getProtocol(functionCode) {
		let len = functionCode.split('/') || [];
		return {
			protocol: {
				'functionCode':functionCode,
			}
		};
	}
}
export default WebApi;
