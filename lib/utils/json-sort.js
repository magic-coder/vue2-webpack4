import { isArray, isFunction, isNumber } from './lang';
const json = typeof JSON !== 'undefined' ? JSON : {
    stringify(str) {
        return str;
    }
};
const hasOwnProperty = Object.prototype.hasOwnProperty || function () {
    return true;
};
const objectKeys = Object.keys || function (obj) {
    const keys = [];
    for (const key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            keys.push(key);
        }
    }
    return keys;
};
// For javascript json key deep sort by alpha character asc
// var obj = { c: 8, b: [{z:6,y:5,x:4},7], a: 3 };
// ==>"{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}"
// Note: if key value is undefined it will be removed. it's an standard JSON.stringify(). method.
//
const stringify = function (obj, opts) {
    opts = isFunction(opts) ? { cmp: opts } : (opts || {});
    const space = isNumber(opts.space) ? Array(opts.space + 1).join(' ') : (opts.space || '');
    const cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    const replacer = opts.replacer || function (key, value) {
        return value;
    };
    const cmp = opts.cmp && ((f) => (node) => (a, b) => f({ key: a, value: node[a] }, { key: b, value: node[b] }))(opts.cmp);
    const seen = [];
    return (function stringifyFn(parent, key, node, level) {
        const indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        const colonSeparator = space ? ': ' : ':';
        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }
        node = replacer.call(parent, key, node);
        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            const out = [];
            for (let i = 0; i < node.length; i++) {
                const item = stringifyFn(node, i, node[i], level + 1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) {
                    return json.stringify('__cycle__');
                }
                throw new TypeError('Converting circular structure to JSON');
            }
            else {
                seen.push(node);
            }
            const keys = objectKeys(node).sort(cmp && cmp(node));
            const out = [];
            for (let i = 0; i < keys.length; i++) {
                const newkey = keys[i];
                const value = stringifyFn(node, newkey, node[newkey], level + 1);
                if (!value) {
                    continue;
                }
                const keyValue = json.stringify(newkey) + colonSeparator + value;
                out.push(indent + space + keyValue);
            }
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};
export const parsed = (obj) => {
    return JSON.parse(stringify(obj));
};
export default stringify;
