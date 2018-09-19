import { isPlainObject } from './lang';
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
export const repeat = (str = '', count = 0) => {
    count = Math.floor(count);
    if (str.length === 0 || count === 0) {
        return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
        throw new RangeError('repeat count must not overflow maximum string size');
    }
    let rpt = '';
    for (let i = 0; i < count; i++) {
        rpt += str;
    }
    return rpt;
};
/**
 * Pads a given string or number with zeros.
 *
 * @param {any} value Value to zero-pad.
 * @param {number} [length=2] Amount of characters to pad.
 * @returns Left-padded number/string.
 */
export const zeroPad = (value, length = 2) => {
    if (length === 0) {
        return value;
    }
    const strValue = String(value);
    return strValue.length >= length ? strValue : (repeat('0', length) + strValue).slice(length * -1);
};
/**
 * 针对卡号的掩码
 * @param  {String} str 需转换字符串
 * @param  {Number} startLen 开头保留字符串长度
 * @param  {Number} tailLen 末尾保留字符串长度
 * @param  {String} mask 替换符号
 * @return {String}
 */
export const getMaskedString = (str, startLen, tailLen, mask) => {
    str = str || '';
    if (startLen + tailLen >= str.length) {
        return str;
    }
    const maskStr = str.replace(new RegExp(`^.{${startLen}}`), '').replace(new RegExp(`.{${tailLen}}$`), '');
    const masks = [];
    for (let i = 0; i < maskStr.length; i++) {
        masks.push(mask || '*');
    }
    return str.substring(0, startLen) + masks.join('') + str.substr(-tailLen, str.length);
};
export const trim = (value) => {
    return value && value.replace(/^\s+|\s+$/g, '') || '';
};
/**
 * Clear white Space, for idcard, bankcard,phone number directive
 * @param {String} str
 * @param {String} pattern '\\s*'
 */
export const cleanWhitespace = (str, pattern) => {
    return str && str.replace(new RegExp(pattern || '\\s*', 'g'), '') || '';
};
/**
 *
 * string formatter,stringFormat('my name is {0}{1}', 'yingchun', 'tian')
 * @param  {...[string]} args
 * @return {String}  he formatted string.
 */
export const stringFormat = (...args) => {
    let fmt = args[0];
    for (let ndx = 1; ndx < args.length; ++ndx) {
        // replace {1} with argument[1], {2} with argument[2], etc.
        const argVal = isPlainObject(args[ndx]) ? JSON.stringify(args[ndx]) : args[ndx];
        fmt = fmt.replace(new RegExp('\\{' + (ndx - 1) + '\\}', 'g'), argVal);
    }
    // return the formatted string
    return fmt;
};
const rHyphen = /-(.)/g;
export const camelize = (string) => {
    return string.replace(rHyphen, (_, chr) => chr.toUpperCase());
};
