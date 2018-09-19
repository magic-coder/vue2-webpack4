// http://travistidwell.com/jsencrypt/index.html
import JSEncrypt from './js-encrypt';
import stringify from './json-sort';
import hex_md5 from './md5';
/**
 * 请求后台获取RSA公钥
 * @param  {String}   pubKey  "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJD6jE2g9yS/igsWWDuL3W73d7v5BTLYLiVyPo3YowPvEngudB7pRKMoLFHS3A4jWQWFebU6RVOkEwjNaAfo+u8CAwEAAQ=="
 * @param  {String}   content  the content will be encrypted.
 * @return {String}   encrypted result string.
 */
const encrypt = (pubKey, content) => {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(pubKey);
    return encryptor.encrypt(content);
};
/**
 * The signature sservice used to sign  quest params objects
 * @author tianyingchun
 * @date   2016-01-13
 * @param  {Object}   reqDataParam the object your need to do signature
 * @return {String}   base64 string.
 */
const signatureReqParam = (rsaPublicKey, reqDataParam) => {
    const newParams = encodeURIComponent(stringify(reqDataParam));
    console.log('sorted request params', newParams);
    const md5edParamsStr = hex_md5(newParams);
    console.log('hex_md5 sorted JsonStringify(reqParams): ', md5edParamsStr);
    return encrypt(rsaPublicKey, md5edParamsStr);
};
export { signatureReqParam, encrypt };
