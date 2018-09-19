export const getQueryString = (name, search) => {
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    const r = (search || window.location.search.substr(1)).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    }
    // FIXME.compatibility if we getQueryString('env')
    return name === 'env' ? 'prod' : null;
};
export const isHttpUrl = (url) => {
    // match //www.baidu.com pattern
    return url && (url.indexOf('//') === 0 || new RegExp('(https|http|ftp)?://').test(url));
};
/**
 * @description parseParamToObj("a=1&b=2&a=3") ==> {a: "3", b: "2"}
 * @param  {string} str query string
 * @returns {Object} the object mapping to all query string.
 */
export const parseParamToObj = (str) => {
    if (!str) {
        return {};
    }
    return str.split('&').reduce(function interator(params, param) {
        // handle "key=value=string=me";
        const equalIndex = param.indexOf('=');
        let paramsFragments = [];
        if (equalIndex !== -1) {
            paramsFragments = [param.substr(0, equalIndex), param.substr(equalIndex + 1)];
        }
        else {
            paramsFragments = [param];
        }
        const paramSplit = paramsFragments.map((value) => {
            return decodeURIComponent(value.replace('+', ' '));
        });
        params[paramSplit[0]] = paramSplit[1];
        return params;
    }, {});
};
/**
 * @description parse objet to query string, if we passed parameter key==="" remove "=" sign
 * @param  {object} obj {name:'ssss', password:''}
 * @returns {String} the string converted from query Object.
 */
export const toQueryString = (obj) => {
    const parts = [];
    for (const i in obj) {
        if (obj.hasOwnProperty(i)) {
            const paramValue = encodeURIComponent(obj[i]);
            if (paramValue === '' || paramValue === 'undefined') {
                parts.push(encodeURIComponent(i));
            }
            else {
                parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
            }
        }
    }
    return parts.join('&');
};
export const getSerializedUrl = (url, requestData) => {
    const serializedParams = toQueryString(requestData);
    return serializedParams ? url.split('?')[0] + '?' + serializedParams : url.split('?')[0];
};
export const parseURL = (url) => {
    const parser = document.createElement('a');
    // Let the browser do the work
    parser.href = url;
    const searchObject = {};
    // Convert query string to object
    const queries = parser.search.replace(/^\?/, '').split('&');
    for (let i = 0; i < queries.length; i++) {
        const split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject,
        hash: parser.hash
    };
};
/**
 * normalize your url segments.
 * @param {...[String]} args '/','path/','to/'
 * @return {String} without prefix '/'
 */
export const normalize = (http, ...args) => {
    const result = [];
    if (isHttpUrl(http)) {
        http = http.replace(/\/*$/, '/');
    }
    else {
        if (http) {
            args.unshift(http);
            http = '';
        }
    }
    args.forEach((path) => {
        const newPath = path ? path.replace(/^\/+|\/+$/ig, '') : '';
        if (newPath) {
            result.push(newPath);
        }
    });
    return http + result.join('/').replace(/\/{2,}/ig, '/');
};
/**
 * @param {String}  url
 * @param {String} isHttp 'http' | 'https'
 */
export const convertURL = (url, isHttp) => {
    // 支持双协议的域名，这里的配置必须要同时支持http,以及https
    const matchUsingHttpsHosts = [
        '.ly.com$',
        '.40017.cn$'
    ];
    isHttp = isHttp === 'http';
    if (!url) {
        return url;
    }
    const parsedJSON = parseURL(url);
    const protocol = parsedJSON.protocol;
    const regex = isHttp ? new RegExp('^http:$') : new RegExp('^https:$');
    // 符合指定的转换预期(http, https)?
    if (regex.test(protocol)) {
        return url;
    }
    const hostname = parsedJSON.hostname;
    // 获取端口号
    const port = parsedJSON.port;
    const hosts = matchUsingHttpsHosts;
    for (let i = 0; i < hosts.length; i++) {
        const host = hosts[i];
        // 必须要不包含端口才进行转换
        if (new RegExp(host).test(hostname) && !port) {
            url = isHttp ? url.replace(/^https:\/\//, 'http://') : url.replace(/^http:\/\//, 'https://');
            break;
        }
    }
    return url;
};
/**
 * 根据当前HOST 的URL自动转换URL协议
 * @param  {String} url 需要转换的URL
 */
export const autoHttpHttps = (url) => {
    const currUrl = window.location.href;
    const parsedJSON = parseURL(currUrl);
    let convertedUrl = url;
    switch (parsedJSON.protocol) {
        case 'http:':
            convertedUrl = convertURL(url, 'http');
            break;
        case 'https:':
            convertedUrl = convertURL(url, 'https');
            break;
    }
    return convertedUrl;
};
/**
 * add url parameters e.g. http://wwww.domain.com/path/to/you?name=tian&pwd=xxx#/home
 * @param  {String}   key   the param key e.g. `name`
 * @param  {String}   value the param value of key e.g. `tian`, if null will remove this key
 * @param  {String}   url the url you want to modified.
 * @return {String}   new url
 */
export const appendUrlParameter = (key, value, url) => {
    url = url || window.location.href || '';
    const urlFragmentHash = url.split(/#/)[1] || '';
    const urlFragments = url.replace('#' + urlFragmentHash, '').split('?');
    const urlRoot = urlFragments[0] || '';
    const urlParams = urlFragments[1] || '';
    const params = parseParamToObj(urlParams);
    if (value === null || value === undefined) {
        delete params[key];
    }
    else {
        params[key] = value;
    }
    const finalUrlFragments = [urlRoot];
    const newUrlParamStr = toQueryString(params);
    if (newUrlParamStr) {
        finalUrlFragments.push('?' + newUrlParamStr);
    }
    if (urlFragmentHash) {
        if (newUrlParamStr) {
            finalUrlFragments.push('#' + urlFragmentHash);
        }
        else {
            finalUrlFragments.push('?#' + urlFragmentHash);
        }
    }
    return finalUrlFragments.join('');
};
