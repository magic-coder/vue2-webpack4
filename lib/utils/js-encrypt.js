/* tslint:disable */
/*! JSEncrypt v2.3.1 | https://npmcdn.com/jsencrypt@2.3.1/LICENSE.txt */
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See 'LICENSE' for details.
// Basic JavaScript BN library - subset useful for RSA encryption.
// Bits per digit
let dbits;
let KJUR = {};
// JavaScript engine analysis
const canary = 0xdeadbeefcafe;
const j_lm = ((canary & 0xffffff) == 0xefcafe);
// (public) Constructor
function BigInteger(a, b, c) {
    if (a != null) {
        if ('number' == typeof a) {
            this.fromNumber(a, b, c);
        }
        else if (b == null && 'string' != typeof a) {
            this.fromString(a, 256);
        }
        else {
            this.fromString(a, b);
        }
    }
}
// return new, unset BigInteger
function nbi() { return new BigInteger(null); }
// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.
// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i, x, w, j, c, n) {
    while (--n >= 0) {
        const v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 0x4000000);
        w[j++] = v & 0x3ffffff;
    }
    return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i, x, w, j, c, n) {
    const xl = x & 0x7fff, xh = x >> 15;
    while (--n >= 0) {
        let l = this[i] & 0x7fff;
        const h = this[i++] >> 15;
        const m = xh * l + h * xl;
        l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 0x3fffffff;
    }
    return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i, x, w, j, c, n) {
    const xl = x & 0x3fff;
    const xh = x >> 14;
    while (--n >= 0) {
        let l = this[i] & 0x3fff;
        const h = this[i++] >> 14;
        const m = xh * l + h * xl;
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 0xfffffff;
    }
    return c;
}
if (j_lm && (navigator.appName == 'Microsoft Internet Explorer')) {
    BigInteger.prototype.am = am2;
    dbits = 30;
}
else if (j_lm && (navigator.appName != 'Netscape')) {
    BigInteger.prototype.am = am1;
    dbits = 26;
}
else {
    BigInteger.prototype.am = am3;
    dbits = 28;
}
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1 << dbits) - 1);
BigInteger.prototype.DV = (1 << dbits);
const BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;
// Digit conversions
const BI_RM = '0123456789abcdefghijklmnopqrstuvwxyz';
const BI_RC = new Array();
let rr;
let vv;
rr = '0'.charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) {
    BI_RC[rr++] = vv;
}
rr = 'a'.charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}
rr = 'A'.charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}
function int2char(n) { return BI_RM.charAt(n); }
function intAt(s, i) {
    const c = BI_RC[s.charCodeAt(i)];
    return (c == null) ? -1 : c;
}
// (protected) copy this to r
function bnpCopyTo(r) {
    for (let i = this.t - 1; i >= 0; --i) {
        r[i] = this[i];
    }
    r.t = this.t;
    r.s = this.s;
}
// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
    this.t = 1;
    this.s = (x < 0) ? -1 : 0;
    if (x > 0) {
        this[0] = x;
    }
    else if (x < -1) {
        this[0] = x + this.DV;
    }
    else {
        this.t = 0;
    }
}
// return bigint initialized to value
function nbv(i) { const r = nbi(); r.fromInt(i); return r; }
// (protected) set from string and radix
function bnpFromString(s, b) {
    let k;
    if (b == 16) {
        k = 4;
    }
    else if (b == 8) {
        k = 3;
    }
    else if (b == 256) {
        k = 8;
    }
    else if (b == 2) {
        k = 1;
    }
    else if (b == 32) {
        k = 5;
    }
    else if (b == 4) {
        k = 2;
    }
    else {
        this.fromRadix(s, b);
        return;
    }
    this.t = 0;
    this.s = 0;
    let i = s.length;
    let mi = false;
    let sh = 0;
    while (--i >= 0) {
        const x = (k == 8) ? s[i] & 0xff : intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == '-') {
                mi = true;
            }
            continue;
        }
        mi = false;
        if (sh == 0) {
            this[this.t++] = x;
        }
        else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
            this[this.t++] = (x >> (this.DB - sh));
        }
        else {
            this[this.t - 1] |= x << sh;
        }
        sh += k;
        if (sh >= this.DB) {
            sh -= this.DB;
        }
    }
    if (k == 8 && (s[0] & 0x80) != 0) {
        this.s = -1;
        if (sh > 0) {
            this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
        }
    }
    this.clamp();
    if (mi) {
        BigIntegerZERO.subTo(this, this);
    }
}
// (protected) clamp off excess high words
function bnpClamp() {
    const c = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == c) {
        --this.t;
    }
}
// (public) return string representation in given radix
function bnToString(b) {
    if (this.s < 0) {
        return '-' + this.negate().toString(b);
    }
    let k;
    if (b == 16) {
        k = 4;
    }
    else if (b == 8) {
        k = 3;
    }
    else if (b == 2) {
        k = 1;
    }
    else if (b == 32) {
        k = 5;
    }
    else if (b == 4) {
        k = 2;
    }
    else {
        return this.toRadix(b);
    }
    const km = (1 << k) - 1;
    let d;
    let m = false;
    let r = '';
    let i = this.t;
    let p = this.DB - (i * this.DB) % k;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;
            r = int2char(d);
        }
        while (i >= 0) {
            if (p < k) {
                d = (this[i] & ((1 << p) - 1)) << (k - p);
                d |= this[--i] >> (p += this.DB - k);
            }
            else {
                d = (this[i] >> (p -= k)) & km;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if (d > 0) {
                m = true;
            }
            if (m) {
                r += int2char(d);
            }
        }
    }
    return m ? r : '0';
}
// (public) -this
function bnNegate() { const r = nbi(); BigIntegerZERO.subTo(this, r); return r; }
// (public) |this|
function bnAbs() { return (this.s < 0) ? this.negate() : this; }
// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
    let r = this.s - a.s;
    if (r != 0) {
        return r;
    }
    let i = this.t;
    r = i - a.t;
    if (r != 0) {
        return (this.s < 0) ? -r : r;
    }
    while (--i >= 0) {
        if ((r = this[i] - a[i]) != 0) {
            return r;
        }
    }
    return 0;
}
// returns bit length of the integer x
function nbits(x) {
    let r = 1;
    let t;
    if ((t = x >>> 16) != 0) {
        x = t;
        r += 16;
    }
    if ((t = x >> 8) != 0) {
        x = t;
        r += 8;
    }
    if ((t = x >> 4) != 0) {
        x = t;
        r += 4;
    }
    if ((t = x >> 2) != 0) {
        x = t;
        r += 2;
    }
    if ((t = x >> 1) != 0) {
        x = t;
        r += 1;
    }
    return r;
}
// (public) return the number of bits in 'this'
function bnBitLength() {
    if (this.t <= 0) {
        return 0;
    }
    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
}
// (protected) r = this << n*DB
function bnpDLShiftTo(n, r) {
    let i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + n] = this[i];
    }
    for (i = n - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r.t = this.t + n;
    r.s = this.s;
}
// (protected) r = this >> n*DB
function bnpDRShiftTo(n, r) {
    for (let i = n; i < this.t; ++i) {
        r[i - n] = this[i];
    }
    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
}
// (protected) r = this << n
function bnpLShiftTo(n, r) {
    const bs = n % this.DB;
    const cbs = this.DB - bs;
    const bm = (1 << cbs) - 1;
    const ds = Math.floor(n / this.DB);
    let c = (this.s << bs) & this.DM;
    let i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = (this[i] >> cbs) | c;
        c = (this[i] & bm) << bs;
    }
    for (i = ds - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
}
// (protected) r = this >> n
function bnpRShiftTo(n, r) {
    r.s = this.s;
    const ds = Math.floor(n / this.DB);
    if (ds >= this.t) {
        r.t = 0;
        return;
    }
    const bs = n % this.DB;
    const cbs = this.DB - bs;
    const bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;
    for (let i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
    }
    if (bs > 0) {
        r[this.t - ds - 1] |= (this.s & bm) << cbs;
    }
    r.t = this.t - ds;
    r.clamp();
}
// (protected) r = this - a
function bnpSubTo(a, r) {
    let i = 0;
    let c = 0;
    const m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] - a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c -= a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    }
    else {
        c += this.s;
        while (i < a.t) {
            c -= a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c -= a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c < -1) {
        r[i++] = this.DV + c;
    }
    else if (c > 0) {
        r[i++] = c;
    }
    r.t = i;
    r.clamp();
}
// (protected) r = this * a, r != this,a (HAC 14.12)
// 'this' should be the larger one if appropriate.
function bnpMultiplyTo(a, r) {
    const x = this.abs();
    const y = a.abs();
    let i = x.t;
    r.t = i + y.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < y.t; ++i) {
        r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
    }
    r.s = 0;
    r.clamp();
    if (this.s != a.s) {
        BigIntegerZERO.subTo(r, r);
    }
}
// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
    const x = this.abs();
    let i = r.t = 2 * x.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < x.t - 1; ++i) {
        const c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r[i + x.t] -= x.DV;
            r[i + x.t + 1] = 1;
        }
    }
    if (r.t > 0) {
        r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    }
    r.s = 0;
    r.clamp();
}
// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m, q, r) {
    const pm = m.abs();
    if (pm.t <= 0) {
        return;
    }
    const pt = this.abs();
    if (pt.t < pm.t) {
        if (q != null) {
            q.fromInt(0);
        }
        if (r != null) {
            this.copyTo(r);
        }
        return;
    }
    if (r == null) {
        r = nbi();
    }
    const y = nbi(), ts = this.s, ms = m.s;
    const nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
    if (nsh > 0) {
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r);
    }
    else {
        pm.copyTo(y);
        pt.copyTo(r);
    }
    const ys = y.t;
    const y0 = y[ys - 1];
    if (y0 == 0) {
        return;
    }
    const yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
    const d1 = this.FV / yt;
    const d2 = (1 << this.F1) / yt;
    const e = 1 << this.F2;
    let i = r.t, j = i - ys;
    const t = (q == null) ? nbi() : q;
    y.dlShiftTo(j, t);
    if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
    }
    BigIntegerONE.dlShiftTo(ys, t);
    // 'negative' y so we can replace sub with am later
    t.subTo(y, y);
    while (y.t < ys) {
        y[y.t++] = 0;
    }
    while (--j >= 0) {
        // Estimate quotient digit
        let qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
            y.dlShiftTo(j, t);
            r.subTo(t, r);
            while (r[i] < --qd) {
                r.subTo(t, r);
            }
        }
    }
    if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms) {
            BigIntegerZERO.subTo(q, q);
        }
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) {
        // Denormalize remainder
        r.rShiftTo(nsh, r);
    }
    if (ts < 0) {
        BigIntegerZERO.subTo(r, r);
    }
}
// (public) this mod a
function bnMod(a) {
    let r = nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(BigIntegerZERO) > 0) {
        a.subTo(r, r);
    }
    return r;
}
// Modular reduction using 'classic' algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
    if (x.s < 0 || x.compareTo(this.m) >= 0) {
        return x.mod(this.m);
    }
    else {
        return x;
    }
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m, null, x); }
function cMulTo(x, y, r) { x.multiplyTo(y, r); this.reduce(r); }
function cSqrTo(x, r) { x.squareTo(r); this.reduce(r); }
Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;
// (protected) return '-1/this % 2^DB'; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply 'overflows' differently from C/C++, so care is needed here.
function bnpInvDigit() {
    if (this.t < 1) {
        return 0;
    }
    let x = this[0];
    if ((x & 1) == 0) {
        return 0;
    }
    let y = x & 3; // y == 1/x mod 2^2
    y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
    y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
    y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y > 0) ? this.DV - y : -y;
}
// Montgomery reduction
function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << (m.DB - 15)) - 1;
    this.mt2 = 2 * m.t;
}
// xR mod m
function montConvert(x) {
    let r = nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(BigIntegerZERO) > 0) {
        this.m.subTo(r, r);
    }
    return r;
}
// x/R mod m
function montRevert(x) {
    const r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
}
// x = x/R mod m (HAC 14.32)
function montReduce(x) {
    // pad x so am has enough room later
    while (x.t <= this.mt2) {
        x[x.t++] = 0;
    }
    for (let i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        let j = x[i] & 0x7fff;
        const u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
        // use am to combine the multiply-shift-add into one call
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        // propagate carry
        while (x[j] >= x.DV) {
            x[j] -= x.DV;
            x[++j]++;
        }
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
}
// r = 'x^2/R mod m'; x != r
function montSqrTo(x, r) { x.squareTo(r); this.reduce(r); }
// r = 'xy/R mod m'; x,y != r
function montMulTo(x, y, r) { x.multiplyTo(y, r); this.reduce(r); }
Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;
// (protected) true iff this is even
function bnpIsEven() { return ((this.t > 0) ? (this[0] & 1) : this.s) == 0; }
// (protected) this^e, e < 2^32, doing sqr and mul with 'r' (HAC 14.79)
function bnpExp(e, z) {
    if (e > 0xffffffff || e < 1) {
        return BigIntegerONE;
    }
    let r = nbi();
    let r2 = nbi();
    let i = nbits(e) - 1;
    const g = z.convert(this);
    g.copyTo(r);
    while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & (1 << i)) > 0) {
            z.mulTo(r2, g, r);
        }
        else {
            const t = r;
            r = r2;
            r2 = t;
        }
    }
    return z.revert(r);
}
// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e, m) {
    let z;
    if (e < 256 || m.isEven()) {
        z = new Classic(m);
    }
    else {
        z = new Montgomery(m);
    }
    return this.exp(e, z);
}
// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;
// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;
// 'constants'
const BigIntegerZERO = nbv(0);
const BigIntegerONE = nbv(1);
// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See 'LICENSE' for details.
// Extended JavaScript BN functions, required for RSA private ops.
// Version 1.1: new BigInteger('0', 10) returns 'proper' zero
// Version 1.2: square() API, isProbablePrime fix
// (public)
function bnClone() { let r = nbi(); this.copyTo(r); return r; }
// (public) return value as integer
function bnIntValue() {
    if (this.s < 0) {
        if (this.t == 1) {
            return this[0] - this.DV;
        }
        else if (this.t == 0) {
            return -1;
        }
    }
    else if (this.t == 1) {
        return this[0];
    }
    else if (this.t == 0) {
        return 0;
    }
    else { }
    // assumes 16 < DB < 32
    return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
}
// (public) return value as byte
function bnByteValue() { return (this.t == 0) ? this.s : (this[0] << 24) >> 24; }
// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t == 0) ? this.s : (this[0] << 16) >> 16; }
// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2 * this.DB / Math.log(r)); }
// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
    if (this.s < 0) {
        return -1;
    }
    else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) {
        return 0;
    }
    else {
        return 1;
    }
}
// (protected) convert to radix string
function bnpToRadix(b) {
    if (b == null) {
        b = 10;
    }
    if (this.signum() == 0 || b < 2 || b > 36) {
        return '0';
    }
    const cs = this.chunkSize(b);
    const a = Math.pow(b, cs);
    const d = nbv(a);
    const y = nbi();
    const z = nbi();
    let r = '';
    this.divRemTo(d, y, z);
    while (y.signum() > 0) {
        r = (a + z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d, y, z);
    }
    return z.intValue().toString(b) + r;
}
// (protected) convert from radix string
function bnpFromRadix(s, b) {
    this.fromInt(0);
    if (b == null) {
        b = 10;
    }
    const cs = this.chunkSize(b);
    const d = Math.pow(b, cs);
    let mi = false;
    let j = 0;
    let w = 0;
    for (let i = 0; i < s.length; ++i) {
        const x = intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == '-' && this.signum() == 0) {
                mi = true;
            }
            continue;
        }
        w = b * w + x;
        if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
        }
    }
    if (j > 0) {
        this.dMultiply(Math.pow(b, j));
        this.dAddOffset(w, 0);
    }
    if (mi) {
        BigIntegerZERO.subTo(this, this);
    }
}
// (protected) alternate constructor
function bnpFromNumber(a, b, c) {
    if ('number' == typeof b) {
        // new BigInteger(int,int,RNG)
        if (a < 2) {
            this.fromInt(1);
        }
        else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1)) {
                // force MSB set
                this.bitwiseTo(BigIntegerONE.shiftLeft(a - 1), op_or, this);
            }
            if (this.isEven()) {
                // force odd
                this.dAddOffset(1, 0);
            }
            while (!this.isProbablePrime(b)) {
                this.dAddOffset(2, 0);
                if (this.bitLength() > a) {
                    this.subTo(BigIntegerONE.shiftLeft(a - 1), this);
                }
            }
        }
    }
    else {
        // new BigInteger(int,RNG)
        const x = new Array();
        const t = a & 7;
        x.length = (a >> 3) + 1;
        b.nextBytes(x);
        if (t > 0) {
            x[0] &= ((1 << t) - 1);
        }
        else {
            x[0] = 0;
        }
        this.fromString(x, 256);
    }
}
// (public) convert to bigendian byte array
function bnToByteArray() {
    let i = this.t;
    const r = new Array();
    r[0] = this.s;
    let p = this.DB - (i * this.DB) % 8;
    let d;
    let k = 0;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) {
            r[k++] = d | (this.s << (this.DB - p));
        }
        while (i >= 0) {
            if (p < 8) {
                d = (this[i] & ((1 << p) - 1)) << (8 - p);
                d |= this[--i] >> (p += this.DB - 8);
            }
            else {
                d = (this[i] >> (p -= 8)) & 0xff;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if ((d & 0x80) != 0) {
                d |= -256;
            }
            if (k == 0 && (this.s & 0x80) != (d & 0x80)) {
                ++k;
            }
            if (k > 0 || d != this.s) {
                r[k++] = d;
            }
        }
    }
    return r;
}
function bnEquals(a) { return (this.compareTo(a) == 0); }
function bnMin(a) { return (this.compareTo(a) < 0) ? this : a; }
function bnMax(a) { return (this.compareTo(a) > 0) ? this : a; }
// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a, op, r) {
    let i;
    let f;
    const m = Math.min(a.t, this.t);
    for (i = 0; i < m; ++i) {
        r[i] = op(this[i], a[i]);
    }
    if (a.t < this.t) {
        f = a.s & this.DM;
        for (i = m; i < this.t; ++i) {
            r[i] = op(this[i], f);
        }
        r.t = this.t;
    }
    else {
        f = this.s & this.DM;
        for (i = m; i < a.t; ++i) {
            r[i] = op(f, a[i]);
        }
        r.t = a.t;
    }
    r.s = op(this.s, a.s);
    r.clamp();
}
// (public) this & a
function op_and(x, y) { return x & y; }
function bnAnd(a) { const r = nbi(); this.bitwiseTo(a, op_and, r); return r; }
// (public) this | a
function op_or(x, y) { return x | y; }
function bnOr(a) { const r = nbi(); this.bitwiseTo(a, op_or, r); return r; }
// (public) this ^ a
function op_xor(x, y) { return x ^ y; }
function bnXor(a) { const r = nbi(); this.bitwiseTo(a, op_xor, r); return r; }
// (public) this & ~a
function op_andnot(x, y) { return x & ~y; }
function bnAndNot(a) { const r = nbi(); this.bitwiseTo(a, op_andnot, r); return r; }
// (public) ~this
function bnNot() {
    let r = nbi();
    for (let i = 0; i < this.t; ++i) {
        r[i] = this.DM & ~this[i];
    }
    r.t = this.t;
    r.s = ~this.s;
    return r;
}
// (public) this << n
function bnShiftLeft(n) {
    const r = nbi();
    if (n < 0) {
        this.rShiftTo(-n, r);
    }
    else {
        this.lShiftTo(n, r);
    }
    return r;
}
// (public) this >> n
function bnShiftRight(n) {
    const r = nbi();
    if (n < 0) {
        this.lShiftTo(-n, r);
    }
    else {
        this.rShiftTo(n, r);
    }
    return r;
}
// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
    if (x == 0) {
        return -1;
    }
    let r = 0;
    if ((x & 0xffff) == 0) {
        x >>= 16;
        r += 16;
    }
    if ((x & 0xff) == 0) {
        x >>= 8;
        r += 8;
    }
    if ((x & 0xf) == 0) {
        x >>= 4;
        r += 4;
    }
    if ((x & 3) == 0) {
        x >>= 2;
        r += 2;
    }
    if ((x & 1) == 0) {
        ++r;
    }
    return r;
}
// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
    for (let i = 0; i < this.t; ++i) {
        if (this[i] != 0) {
            return i * this.DB + lbit(this[i]);
        }
    }
    if (this.s < 0) {
        return this.t * this.DB;
    }
    return -1;
}
// return number of 1 bits in x
function cbit(x) {
    let r = 0;
    while (x != 0) {
        x &= x - 1;
        ++r;
    }
    return r;
}
// (public) return number of set bits
function bnBitCount() {
    let r = 0;
    const x = this.s & this.DM;
    for (let i = 0; i < this.t; ++i) {
        r += cbit(this[i] ^ x);
    }
    return r;
}
// (public) true iff nth bit is set
function bnTestBit(n) {
    const j = Math.floor(n / this.DB);
    if (j >= this.t) {
        return (this.s != 0);
    }
    return ((this[j] & (1 << (n % this.DB))) != 0);
}
// (protected) this op (1<<n)
function bnpChangeBit(n, op) {
    const r = BigIntegerONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
}
// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n, op_or); }
// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n, op_andnot); }
// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n, op_xor); }
// (protected) r = this + a
function bnpAddTo(a, r) {
    let i = 0;
    let c = 0;
    const m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] + a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c += a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    }
    else {
        c += this.s;
        while (i < a.t) {
            c += a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c > 0) {
        r[i++] = c;
    }
    else if (c < -1) {
        r[i++] = this.DV + c;
    }
    r.t = i;
    r.clamp();
}
// (public) this + a
function bnAdd(a) { const r = nbi(); this.addTo(a, r); return r; }
// (public) this - a
function bnSubtract(a) { const r = nbi(); this.subTo(a, r); return r; }
// (public) this * a
function bnMultiply(a) { const r = nbi(); this.multiplyTo(a, r); return r; }
// (public) this^2
function bnSquare() { const r = nbi(); this.squareTo(r); return r; }
// (public) this / a
function bnDivide(a) { const r = nbi(); this.divRemTo(a, r, null); return r; }
// (public) this % a
function bnRemainder(a) { const r = nbi(); this.divRemTo(a, null, r); return r; }
// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
    const q = nbi();
    const r = nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
}
// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
}
// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n, w) {
    if (n == 0) {
        return;
    }
    while (this.t <= w) {
        this[this.t++] = 0;
    }
    this[w] += n;
    while (this[w] >= this.DV) {
        this[w] -= this.DV;
        if (++w >= this.t) {
            this[this.t++] = 0;
        }
        ++this[w];
    }
}
// A 'null' reducer
function NullExp() { }
function nNop(x) { return x; }
function nMulTo(x, y, r) { x.multiplyTo(y, r); }
function nSqrTo(x, r) { x.squareTo(r); }
NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;
// (public) this^e
function bnPow(e) { return this.exp(e, new NullExp()); }
// (protected) r = lower n words of 'this * a', a.t <= n
// 'this' should be the larger one if appropriate.
function bnpMultiplyLowerTo(a, n, r) {
    let i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0
    r.t = i;
    while (i > 0) {
        r[--i] = 0;
    }
    let j;
    for (j = r.t - this.t; i < j; ++i) {
        r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
    }
    for (j = Math.min(a.t, n); i < j; ++i) {
        this.am(0, a[i], r, i, 0, n - i);
    }
    r.clamp();
}
// (protected) r = 'this * a' without lower n words, n > 0
// 'this' should be the larger one if appropriate.
function bnpMultiplyUpperTo(a, n, r) {
    --n;
    let i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = Math.max(n - this.t, 0); i < a.t; ++i) {
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
    }
    r.clamp();
    r.drShiftTo(1, r);
}
// Barrett modular reduction
function Barrett(m) {
    // setup Barrett
    this.r2 = nbi();
    this.q3 = nbi();
    BigIntegerONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
}
function barrettConvert(x) {
    if (x.s < 0 || x.t > 2 * this.m.t) {
        return x.mod(this.m);
    }
    else if (x.compareTo(this.m) < 0) {
        return x;
    }
    else {
        const r = nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
    }
}
function barrettRevert(x) { return x; }
// x = x mod m (HAC 14.42)
function barrettReduce(x) {
    x.drShiftTo(this.m.t - 1, this.r2);
    if (x.t > this.m.t + 1) {
        x.t = this.m.t + 1;
        x.clamp();
    }
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
    while (x.compareTo(this.r2) < 0)
        x.dAddOffset(1, this.m.t + 1);
    x.subTo(this.r2, x);
    while (x.compareTo(this.m) >= 0)
        x.subTo(this.m, x);
}
// r = x^2 mod m; x != r
function barrettSqrTo(x, r) { x.squareTo(r); this.reduce(r); }
// r = x*y mod m; x,y != r
function barrettMulTo(x, y, r) { x.multiplyTo(y, r); this.reduce(r); }
Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;
// (public) this^e % m (HAC 14.85)
function bnModPow(e, m) {
    let i = e.bitLength();
    let k;
    let r = nbv(1);
    let z;
    if (i <= 0) {
        return r;
    }
    else if (i < 18) {
        k = 1;
    }
    else if (i < 48) {
        k = 3;
    }
    else if (i < 144) {
        k = 4;
    }
    else if (i < 768) {
        k = 5;
    }
    else {
        k = 6;
    }
    if (i < 8) {
        z = new Classic(m);
    }
    else if (m.isEven()) {
        z = new Barrett(m);
    }
    else {
        z = new Montgomery(m);
    }
    // precomputation
    const g = new Array();
    let n = 3;
    let k1 = k - 1;
    let km = (1 << k) - 1;
    g[1] = z.convert(this);
    if (k > 1) {
        const g2 = nbi();
        z.sqrTo(g[1], g2);
        while (n <= km) {
            g[n] = nbi();
            z.mulTo(g2, g[n - 2], g[n]);
            n += 2;
        }
    }
    let j = e.t - 1;
    let w;
    let is1 = true;
    let r2 = nbi();
    let t;
    i = nbits(e[j]) - 1;
    while (j >= 0) {
        if (i >= k1) {
            w = (e[j] >> (i - k1)) & km;
        }
        else {
            w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
            if (j > 0) {
                w |= e[j - 1] >> (this.DB + i - k1);
            }
        }
        n = k;
        while ((w & 1) == 0) {
            w >>= 1;
            --n;
        }
        if ((i -= n) < 0) {
            i += this.DB;
            --j;
        }
        if (is1) {
            g[w].copyTo(r);
            is1 = false;
        }
        else {
            while (n > 1) {
                z.sqrTo(r, r2);
                z.sqrTo(r2, r);
                n -= 2;
            }
            if (n > 0) {
                z.sqrTo(r, r2);
            }
            else {
                t = r;
                r = r2;
                r2 = t;
            }
            z.mulTo(r2, g[w], r);
        }
        while (j >= 0 && (e[j] & (1 << i)) == 0) {
            z.sqrTo(r, r2);
            t = r;
            r = r2;
            r2 = t;
            if (--i < 0) {
                i = this.DB - 1;
                --j;
            }
        }
    }
    return z.revert(r);
}
// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
    let x = (this.s < 0) ? this.negate() : this.clone();
    let y = (a.s < 0) ? a.negate() : a.clone();
    if (x.compareTo(y) < 0) {
        const t = x;
        x = y;
        y = t;
    }
    let i = x.getLowestSetBit();
    let g = y.getLowestSetBit();
    if (g < 0) {
        return x;
    }
    if (i < g) {
        g = i;
    }
    if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
    }
    while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0) {
            x.rShiftTo(i, x);
        }
        if ((i = y.getLowestSetBit()) > 0) {
            y.rShiftTo(i, y);
        }
        if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
        }
        else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
        }
    }
    if (g > 0) {
        y.lShiftTo(g, y);
    }
    return y;
}
// (protected) this % n, n < 2^26
function bnpModInt(n) {
    if (n <= 0)
        return 0;
    let d = this.DV % n, r = (this.s < 0) ? n - 1 : 0;
    if (this.t > 0) {
        if (d == 0) {
            r = this[0] % n;
        }
        else {
            for (let i = this.t - 1; i >= 0; --i) {
                r = (d * r + this[i]) % n;
            }
        }
    }
    return r;
}
// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
    const ac = m.isEven();
    if ((this.isEven() && ac) || m.signum() == 0) {
        return BigIntegerZERO;
    }
    const u = m.clone(), v = this.clone();
    const a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
    while (u.signum() != 0) {
        while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
                if (!a.isEven() || !b.isEven()) {
                    a.addTo(this, a);
                    b.subTo(m, b);
                }
                a.rShiftTo(1, a);
            }
            else if (!b.isEven()) {
                b.subTo(m, b);
            }
            b.rShiftTo(1, b);
        }
        while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
                if (!c.isEven() || !d.isEven()) {
                    c.addTo(this, c);
                    d.subTo(m, d);
                }
                c.rShiftTo(1, c);
            }
            else if (!d.isEven()) {
                d.subTo(m, d);
            }
            d.rShiftTo(1, d);
        }
        if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) {
                a.subTo(c, a);
            }
            b.subTo(d, b);
        }
        else {
            v.subTo(u, v);
            if (ac) {
                c.subTo(a, c);
            }
            d.subTo(b, d);
        }
    }
    if (v.compareTo(BigIntegerONE) != 0) {
        return BigIntegerZERO;
    }
    if (d.compareTo(m) >= 0) {
        return d.subtract(m);
    }
    if (d.signum() < 0) {
        d.addTo(m, d);
    }
    else {
        return d;
    }
    if (d.signum() < 0) {
        return d.add(m);
    }
    else {
        return d;
    }
}
const lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
const lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
    let i;
    const x = this.abs();
    if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
        for (i = 0; i < lowprimes.length; ++i) {
            if (x[0] == lowprimes[i]) {
                return true;
            }
        }
        return false;
    }
    if (x.isEven()) {
        return false;
    }
    i = 1;
    while (i < lowprimes.length) {
        let m = lowprimes[i], j = i + 1;
        while (j < lowprimes.length && m < lplim) {
            m *= lowprimes[j++];
        }
        m = x.modInt(m);
        while (i < j) {
            if (m % lowprimes[i++] == 0) {
                return false;
            }
        }
    }
    return x.millerRabin(t);
}
// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
    const n1 = this.subtract(BigIntegerONE);
    const k = n1.getLowestSetBit();
    if (k <= 0)
        return false;
    const r = n1.shiftRight(k);
    t = (t + 1) >> 1;
    if (t > lowprimes.length) {
        t = lowprimes.length;
    }
    const a = nbi();
    for (let i = 0; i < t; ++i) {
        // Pick bases at random, instead of starting at 2
        a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
        let y = a.modPow(r, this);
        if (y.compareTo(BigIntegerONE) != 0 && y.compareTo(n1) != 0) {
            let j = 1;
            while (j++ < k && y.compareTo(n1) != 0) {
                y = y.modPowInt(2, this);
                if (y.compareTo(BigIntegerONE) == 0) {
                    return false;
                }
            }
            if (y.compareTo(n1) != 0) {
                return false;
            }
        }
    }
    return true;
}
// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;
// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
// JSBN-specific extension
BigInteger.prototype.square = bnSquare;
// BigInteger interfaces not implemented in jsbn:
// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)
// prng4.js - uses Arcfour as a PRNG
function Arcfour() {
    this.i = 0;
    this.j = 0;
    this.S = new Array();
}
// Initialize arcfour context from key, an array of ints, each from [0..255]
function ARC4init(key) {
    let i, j, t;
    for (i = 0; i < 256; ++i)
        this.S[i] = i;
    j = 0;
    for (i = 0; i < 256; ++i) {
        j = (j + this.S[i] + key[i % key.length]) & 255;
        t = this.S[i];
        this.S[i] = this.S[j];
        this.S[j] = t;
    }
    this.i = 0;
    this.j = 0;
}
function ARC4next() {
    let t;
    this.i = (this.i + 1) & 255;
    this.j = (this.j + this.S[this.i]) & 255;
    t = this.S[this.i];
    this.S[this.i] = this.S[this.j];
    this.S[this.j] = t;
    return this.S[(t + this.S[this.i]) & 255];
}
Arcfour.prototype.init = ARC4init;
Arcfour.prototype.next = ARC4next;
// Plug in your RNG constructor here
function prng_newstate() {
    return new Arcfour();
}
// Pool size must be a multiple of 4 and greater than 32.
// An array of bytes the size of the pool will be passed to init()
const rng_psize = 256;
// Random number generator - requires a PRNG backend, e.g. prng4.js
let rng_state;
let rng_pool;
let rng_pptr;
// Initialize the pool with junk if needed.
if (rng_pool == null) {
    rng_pool = new Array();
    rng_pptr = 0;
    let t;
    if (window.crypto && window.crypto.getRandomValues) {
        // Extract entropy (2048 bits) from RNG if available
        const z = new Uint32Array(256);
        window.crypto.getRandomValues(z);
        for (t = 0; t < z.length; ++t) {
            rng_pool[rng_pptr++] = z[t] & 255;
        }
    }
    // Use mouse events for entropy, if we do not have enough entropy by the time
    // we need it, entropy will be generated by Math.random.
    const onMouseMoveListener = function (ev) {
        this.count = this.count || 0;
        if (this.count >= 256 || rng_pptr >= rng_psize) {
            if (window.removeEventListener) {
                window.removeEventListener('mousemove', onMouseMoveListener, false);
            }
            else if (window.detachEvent) {
                window.detachEvent('onmousemove', onMouseMoveListener);
            }
            return;
        }
        try {
            let mouseCoordinates = ev.x + ev.y;
            rng_pool[rng_pptr++] = mouseCoordinates & 255;
            this.count += 1;
        }
        catch (e) {
            // Sometimes Firefox will deny permission to access event properties for some reason. Ignore.
        }
    };
    if (window.addEventListener) {
        window.addEventListener('mousemove', onMouseMoveListener, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onmousemove', onMouseMoveListener);
    }
}
function rng_get_byte() {
    if (rng_state == null) {
        rng_state = prng_newstate();
        // At this point, we may not have collected enough entropy.  If not, fall back to Math.random
        while (rng_pptr < rng_psize) {
            const random = Math.floor(65536 * Math.random());
            rng_pool[rng_pptr++] = random & 255;
        }
        rng_state.init(rng_pool);
        for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr) {
            rng_pool[rng_pptr] = 0;
        }
        rng_pptr = 0;
    }
    // TODO: allow reseeding after first request
    return rng_state.next();
}
function rng_get_bytes(ba) {
    let i;
    for (i = 0; i < ba.length; ++i)
        ba[i] = rng_get_byte();
}
function SecureRandom() { }
SecureRandom.prototype.nextBytes = rng_get_bytes;
// Depends on jsbn.js and rng.js
// Version 1.1: support utf-8 encoding in pkcs1pad2
// convert a (hex) string to a bignum object
function parseBigInt(str, r) {
    return new BigInteger(str, r);
}
// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s, n) {
    if (n < s.length + 11) {
        console.error('Message too long for RSA');
        return null;
    }
    const ba = new Array();
    let i = s.length - 1;
    while (i >= 0 && n > 0) {
        const c = s.charCodeAt(i--);
        if (c < 128) {
            ba[--n] = c;
        }
        else if ((c > 127) && (c < 2048)) {
            ba[--n] = (c & 63) | 128;
            ba[--n] = (c >> 6) | 192;
        }
        else {
            ba[--n] = (c & 63) | 128;
            ba[--n] = ((c >> 6) & 63) | 128;
            ba[--n] = (c >> 12) | 224;
        }
    }
    ba[--n] = 0;
    const rng = new SecureRandom();
    const x = new Array();
    while (n > 2) {
        x[0] = 0;
        while (x[0] == 0) {
            rng.nextBytes(x);
        }
        ba[--n] = x[0];
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return new BigInteger(ba);
}
// 'empty' RSA key constructor
function RSAKey() {
    this.n = null;
    this.e = 0;
    this.d = null;
    this.p = null;
    this.q = null;
    this.dmp1 = null;
    this.dmq1 = null;
    this.coeff = null;
}
// Set the public key fields N and e from hex strings
function RSASetPublic(N, E) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
    }
    else {
        console.error('Invalid RSA public key');
    }
}
// Perform raw public operation on 'x': return x^e (mod n)
function RSADoPublic(x) {
    return x.modPowInt(this.e, this.n);
}
// Return the PKCS#1 RSA encryption of 'text' as an even-length hex string
function RSAEncrypt(text) {
    const m = pkcs1pad2(text, (this.n.bitLength() + 7) >> 3);
    if (m == null) {
        return null;
    }
    const c = this.doPublic(m);
    if (c == null) {
        return null;
    }
    const h = c.toString(16);
    if ((h.length & 1) == 0) {
        return h;
    }
    else {
        return '0' + h;
    }
}
// Return the PKCS#1 RSA encryption of 'text' as a Base64-encoded string
// function RSAEncryptB64(text) {
//  let h = this.encrypt(text);
//  if(h) return hex2b64(h); else return null;
// }
// protected
RSAKey.prototype.doPublic = RSADoPublic;
// public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
// RSAKey.prototype.encrypt_b64 = RSAEncryptB64;
// Depends on rsa.js and jsbn2.js
// Version 1.1: support utf-8 decoding in pkcs1unpad2
// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d, n) {
    const b = d.toByteArray();
    let i = 0;
    while (i < b.length && b[i] == 0) {
        ++i;
    }
    if (b.length - i != n - 1 || b[i] != 2) {
        return null;
    }
    ++i;
    while (b[i] != 0) {
        if (++i >= b.length) {
            return null;
        }
    }
    let ret = '';
    while (++i < b.length) {
        const c = b[i] & 255;
        if (c < 128) {
            // utf-8 decode
            ret += String.fromCharCode(c);
        }
        else if ((c > 191) && (c < 224)) {
            ret += String.fromCharCode(((c & 31) << 6) | (b[i + 1] & 63));
            ++i;
        }
        else {
            ret += String.fromCharCode(((c & 15) << 12) | ((b[i + 1] & 63) << 6) | (b[i + 2] & 63));
            i += 2;
        }
    }
    return ret;
}
// Set the private key fields N, e, and d from hex strings
function RSASetPrivate(N, E, D) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
        this.d = parseBigInt(D, 16);
    }
    else {
        console.error('Invalid RSA private key');
    }
}
// Set the private key fields N, e, d and CRT params from hex strings
function RSASetPrivateEx(N, E, D, P, Q, DP, DQ, C) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
        this.d = parseBigInt(D, 16);
        this.p = parseBigInt(P, 16);
        this.q = parseBigInt(Q, 16);
        this.dmp1 = parseBigInt(DP, 16);
        this.dmq1 = parseBigInt(DQ, 16);
        this.coeff = parseBigInt(C, 16);
    }
    else {
        console.error('Invalid RSA private key');
    }
}
// Generate a new random private key B bits long, using public expt E
function RSAGenerate(B, E) {
    const rng = new SecureRandom();
    const qs = B >> 1;
    const ee = new BigInteger(E, 16);
    this.e = parseInt(E, 16);
    for (;;) {
        for (;;) {
            this.p = new BigInteger(B - qs, 1, rng);
            if (this.p.subtract(BigIntegerONE).gcd(ee).compareTo(BigIntegerONE) == 0 && this.p.isProbablePrime(10)) {
                break;
            }
        }
        for (;;) {
            this.q = new BigInteger(qs, 1, rng);
            if (this.q.subtract(BigIntegerONE).gcd(ee).compareTo(BigIntegerONE) == 0 && this.q.isProbablePrime(10)) {
                break;
            }
        }
        if (this.p.compareTo(this.q) <= 0) {
            const t = this.p;
            this.p = this.q;
            this.q = t;
        }
        const p1 = this.p.subtract(BigIntegerONE);
        const q1 = this.q.subtract(BigIntegerONE);
        const phi = p1.multiply(q1);
        if (phi.gcd(ee).compareTo(BigIntegerONE) == 0) {
            this.n = this.p.multiply(this.q);
            this.d = ee.modInverse(phi);
            this.dmp1 = this.d.mod(p1);
            this.dmq1 = this.d.mod(q1);
            this.coeff = this.q.modInverse(this.p);
            break;
        }
    }
}
// Perform raw private operation on 'x': return x^d (mod n)
function RSADoPrivate(x) {
    if (this.p == null || this.q == null) {
        return x.modPow(this.d, this.n);
    }
    // TODO: re-calculate any missing CRT params
    let xp = x.mod(this.p).modPow(this.dmp1, this.p);
    let xq = x.mod(this.q).modPow(this.dmq1, this.q);
    while (xp.compareTo(xq) < 0) {
        xp = xp.add(this.p);
    }
    return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}
// Return the PKCS#1 RSA decryption of 'ctext'.
// 'ctext' is an even-length hex string and the output is a plain string.
function RSADecrypt(ctext) {
    let c = parseBigInt(ctext, 16);
    let m = this.doPrivate(c);
    if (m == null) {
        return null;
    }
    return pkcs1unpad2(m, (this.n.bitLength() + 7) >> 3);
}
// Return the PKCS#1 RSA decryption of 'ctext'.
// 'ctext' is a Base64-encoded string and the output is a plain string.
// function RSAB64Decrypt(ctext) {
//  let h = b64tohex(ctext);
//  if(h) return this.decrypt(h); else return null;
// }
// protected
RSAKey.prototype.doPrivate = RSADoPrivate;
// public
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
// RSAKey.prototype.b64_decrypt = RSAB64Decrypt;
// Copyright (c) 2011  Kevin M Burns Jr.
// All Rights Reserved.
// See 'LICENSE' for details.
//
// Extension to jsbn which adds facilities for asynchronous RSA key generation
// Primarily created to avoid execution timeout on mobile devices
//
// http://www-cs-students.stanford.edu/~tjw/jsbn/
//
// ---
(function () {
    // Generate a new random private key B bits long, using public expt E
    const RSAGenerateAsync = function (B, E, callback) {
        // let rng = new SeededRandom();
        const rng = new SecureRandom();
        const qs = B >> 1;
        const ee = new BigInteger(E, 16);
        const rsa = this;
        this.e = parseInt(E, 16);
        // These functions have non-descript names because they were originally for(;;) loops.
        // I don't know about cryptography to give them better names than loop1-4.
        const loop1 = function () {
            const loop4 = function () {
                if (rsa.p.compareTo(rsa.q) <= 0) {
                    const t = rsa.p;
                    rsa.p = rsa.q;
                    rsa.q = t;
                }
                const p1 = rsa.p.subtract(BigIntegerONE);
                const q1 = rsa.q.subtract(BigIntegerONE);
                const phi = p1.multiply(q1);
                if (phi.gcd(ee).compareTo(BigIntegerONE) == 0) {
                    rsa.n = rsa.p.multiply(rsa.q);
                    rsa.d = ee.modInverse(phi);
                    rsa.dmp1 = rsa.d.mod(p1);
                    rsa.dmq1 = rsa.d.mod(q1);
                    rsa.coeff = rsa.q.modInverse(rsa.p);
                    setTimeout(function () { callback(); }, 0); // escape
                }
                else {
                    setTimeout(loop1, 0);
                }
            };
            const loop3 = function () {
                rsa.q = nbi();
                rsa.q.fromNumberAsync(qs, 1, rng, function () {
                    rsa.q.subtract(BigIntegerONE).gcda(ee, function (r) {
                        if (r.compareTo(BigIntegerONE) == 0 && rsa.q.isProbablePrime(10)) {
                            setTimeout(loop4, 0);
                        }
                        else {
                            setTimeout(loop3, 0);
                        }
                    });
                });
            };
            const loop2 = function () {
                rsa.p = nbi();
                rsa.p.fromNumberAsync(B - qs, 1, rng, function () {
                    rsa.p.subtract(BigIntegerONE).gcda(ee, function (r) {
                        if (r.compareTo(BigIntegerONE) == 0 && rsa.p.isProbablePrime(10)) {
                            setTimeout(loop3, 0);
                        }
                        else {
                            setTimeout(loop2, 0);
                        }
                    });
                });
            };
            setTimeout(loop2, 0);
        };
        setTimeout(loop1, 0);
    };
    RSAKey.prototype.generateAsync = RSAGenerateAsync;
    // Public API method
    const bnGCDAsync = function (a, callback) {
        let x = (this.s < 0) ? this.negate() : this.clone();
        let y = (a.s < 0) ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
            const t = x;
            x = y;
            y = t;
        }
        let i = x.getLowestSetBit();
        let g = y.getLowestSetBit();
        if (g < 0) {
            callback(x);
            return;
        }
        if (i < g) {
            g = i;
        }
        if (g > 0) {
            x.rShiftTo(g, x);
            y.rShiftTo(g, y);
        }
        // Workhorse of the algorithm, gets called 200 - 800 times per 512 bit keygen.
        const gcda1 = function () {
            if ((i = x.getLowestSetBit()) > 0) {
                x.rShiftTo(i, x);
            }
            if ((i = y.getLowestSetBit()) > 0) {
                y.rShiftTo(i, y);
            }
            if (x.compareTo(y) >= 0) {
                x.subTo(y, x);
                x.rShiftTo(1, x);
            }
            else {
                y.subTo(x, y);
                y.rShiftTo(1, y);
            }
            if (!(x.signum() > 0)) {
                if (g > 0) {
                    y.lShiftTo(g, y);
                }
                setTimeout(function () { callback(y); }, 0); // escape
            }
            else {
                setTimeout(gcda1, 0);
            }
        };
        setTimeout(gcda1, 10);
    };
    BigInteger.prototype.gcda = bnGCDAsync;
    // (protected) alternate constructor
    const bnpFromNumberAsync = function (a, b, c, callback) {
        if ('number' == typeof b) {
            if (a < 2) {
                this.fromInt(1);
            }
            else {
                this.fromNumber(a, c);
                if (!this.testBit(a - 1)) {
                    this.bitwiseTo(BigIntegerONE.shiftLeft(a - 1), op_or, this);
                }
                if (this.isEven()) {
                    this.dAddOffset(1, 0);
                }
                const bnp = this;
                const bnpfn1 = function () {
                    bnp.dAddOffset(2, 0);
                    if (bnp.bitLength() > a) {
                        bnp.subTo(BigIntegerONE.shiftLeft(a - 1), bnp);
                    }
                    if (bnp.isProbablePrime(b)) {
                        setTimeout(function () { callback(); }, 0); // escape
                    }
                    else {
                        setTimeout(bnpfn1, 0);
                    }
                };
                setTimeout(bnpfn1, 0);
            }
        }
        else {
            const x = new Array(), t = a & 7;
            x.length = (a >> 3) + 1;
            b.nextBytes(x);
            if (t > 0) {
                x[0] &= ((1 << t) - 1);
            }
            else {
                x[0] = 0;
            }
            this.fromString(x, 256);
        }
    };
    BigInteger.prototype.fromNumberAsync = bnpFromNumberAsync;
})();
const b64map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const b64pad = '=';
function hex2b64(h) {
    let i;
    let c;
    let ret = '';
    for (i = 0; i + 3 <= h.length; i += 3) {
        c = parseInt(h.substring(i, i + 3), 16);
        ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
    }
    if (i + 1 === h.length) {
        c = parseInt(h.substring(i, i + 1), 16);
        ret += b64map.charAt(c << 2);
    }
    else if (i + 2 === h.length) {
        c = parseInt(h.substring(i, i + 2), 16);
        ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
    }
    while ((ret.length & 3) > 0)
        ret += b64pad;
    return ret;
}
// convert a base64 string to hex
function b64tohex(s) {
    let ret = '';
    let i;
    let k = 0; // b64 state, 0-3
    let slop;
    let v;
    for (i = 0; i < s.length; ++i) {
        if (s.charAt(i) === b64pad)
            break;
        v = b64map.indexOf(s.charAt(i));
        if (v < 0) {
            continue;
        }
        if (k === 0) {
            ret += int2char(v >> 2);
            slop = v & 3;
            k = 1;
        }
        else if (k === 1) {
            ret += int2char((slop << 2) | (v >> 4));
            slop = v & 0xf;
            k = 2;
        }
        else if (k === 2) {
            ret += int2char(slop);
            ret += int2char(v >> 2);
            slop = v & 3;
            k = 3;
        }
        else {
            ret += int2char((slop << 2) | (v >> 4));
            ret += int2char(v & 0xf);
            k = 0;
        }
    }
    if (k === 1) {
        ret += int2char(slop << 2);
    }
    return ret;
}
/*! asn1-1.0.2.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
const JSX = {};
JSX.env = JSX.env || {};
const L = JSX, OP = Object.prototype, FUNCTION_TOSTRING = '[object Function]', ADD = ['toString', 'valueOf'];
JSX.env.parseUA = function (agent) {
    return {
        ie: 0,
        opera: 0,
        gecko: 0,
        webkit: 0,
        chrome: 0,
        mobile: null,
        air: 0,
        ipad: 0,
        iphone: 0,
        ipod: 0,
        ios: null,
        android: 0,
        webos: 0,
        caja: null,
        secure: false,
        os: null
    };
};
JSX.env.ua = JSX.env.parseUA();
JSX.isFunction = function (o) {
    return (typeof o === 'function') || OP.toString.apply(o) === FUNCTION_TOSTRING;
};
JSX._IEEnumFix = (JSX.env.ua.ie) ? function (r, s) {
    let i;
    let fname;
    let f;
    for (i = 0; i < ADD.length; i = i + 1) {
        fname = ADD[i];
        f = s[fname];
        if (L.isFunction(f) && f !== OP[fname]) {
            r[fname] = f;
        }
    }
} : function () { };
JSX.extend = function (subc, superc, overrides) {
    if (!superc || !subc) {
        throw new Error('extend failed, please check that ' +
            'all dependencies are included.');
    }
    const F = function () { };
    let i;
    F.prototype = superc.prototype;
    subc.prototype = new F();
    subc.prototype.constructor = subc;
    subc.superclass = superc.prototype;
    if (superc.prototype.constructor === OP.constructor) {
        superc.prototype.constructor = superc;
    }
    if (overrides) {
        for (i in overrides) {
            if (L.hasOwnProperty(overrides, i)) {
                subc.prototype[i] = overrides[i];
            }
        }
        L._IEEnumFix(subc.prototype, overrides);
    }
};
/*
 * asn1.js - ASN.1 DER encoder classes
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be
 * included in all copies or substantial portions of the Software.
 */
/**
 * @fileOverview
 * @name asn1-1.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.0.2 (2013-May-30)
 * @since 2.1
 * @license <a href='http://kjur.github.io/jsrsasign/license/'>MIT License</a>
 */
/**
 * kjur's class library name space
 * <p>
 * This name space provides following name spaces:
 * <ul>
 * <li>{@link KJUR.asn1} - ASN.1 primitive hexadecimal encoder</li>
 * <li>{@link KJUR.asn1.x509} - ASN.1 structure for X.509 certificate and CRL</li>
 * <li>{@link KJUR.crypto} - Java Cryptographic Extension(JCE) style MessageDigest/Signature
 * class and utilities</li>
 * </ul>
 * </p>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * @name KJUR
 * @namespace kjur's class library name space
 */
if (typeof KJUR === 'undefined' || !KJUR) {
    KJUR = {};
}
/**
 * kjur's ASN.1 class library name space
 * <p>
 * This is ITU-T X.690 ASN.1 DER encoder class library and
 * class structure and methods is very similar to
 * org.bouncycastle.asn1 package of
 * well known BouncyCaslte Cryptography Library.
 *
 * <h4>PROVIDING ASN.1 PRIMITIVES</h4>
 * Here are ASN.1 DER primitive classes.
 * <ul>
 * <li>{@link KJUR.asn1.DERBoolean}</li>
 * <li>{@link KJUR.asn1.DERInteger}</li>
 * <li>{@link KJUR.asn1.DERBitString}</li>
 * <li>{@link KJUR.asn1.DEROctetString}</li>
 * <li>{@link KJUR.asn1.DERNull}</li>
 * <li>{@link KJUR.asn1.DERObjectIdentifier}</li>
 * <li>{@link KJUR.asn1.DERUTF8String}</li>
 * <li>{@link KJUR.asn1.DERNumericString}</li>
 * <li>{@link KJUR.asn1.DERPrintableString}</li>
 * <li>{@link KJUR.asn1.DERTeletexString}</li>
 * <li>{@link KJUR.asn1.DERIA5String}</li>
 * <li>{@link KJUR.asn1.DERUTCTime}</li>
 * <li>{@link KJUR.asn1.DERGeneralizedTime}</li>
 * <li>{@link KJUR.asn1.DERSequence}</li>
 * <li>{@link KJUR.asn1.DERSet}</li>
 * </ul>
 *
 * <h4>OTHER ASN.1 CLASSES</h4>
 * <ul>
 * <li>{@link KJUR.asn1.ASN1Object}</li>
 * <li>{@link KJUR.asn1.DERAbstractString}</li>
 * <li>{@link KJUR.asn1.DERAbstractTime}</li>
 * <li>{@link KJUR.asn1.DERAbstractStructured}</li>
 * <li>{@link KJUR.asn1.DERTaggedObject}</li>
 * </ul>
 * </p>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * @name KJUR.asn1
 * @namespace
 */
if (typeof KJUR.asn1 == 'undefined' || !KJUR.asn1) {
    KJUR.asn1 = {};
}
/**
 * ASN1 utilities class
 * @name KJUR.asn1.ASN1Util
 * @classs ASN1 utilities class
 * @since asn1 1.0.2
 */
function KJURAsn1ASN1Util() {
    this.integerToByteHex = function (i) {
        let h = i.toString(16);
        if ((h.length % 2) == 1) {
            h = '0' + h;
        }
        return h;
    };
    this.bigIntToMinTwosComplementsHex = function (bigIntegerValue) {
        let h = bigIntegerValue.toString(16);
        if (h.substr(0, 1) !== '-') {
            if (h.length % 2 === 1) {
                h = '0' + h;
            }
            else {
                if (!h.match(/^[0-7]/)) {
                    h = '00' + h;
                }
            }
        }
        else {
            const hPos = h.substr(1);
            let xorLen = hPos.length;
            if (xorLen % 2 === 1) {
                xorLen += 1;
            }
            else {
                if (!h.match(/^[0-7]/)) {
                    xorLen += 2;
                }
            }
            let hMask = '';
            for (let i = 0; i < xorLen; i++) {
                hMask += 'f';
            }
            const biMask = new BigInteger(hMask, 16);
            const biNeg = biMask.xor(bigIntegerValue).add(BigIntegerONE);
            h = biNeg.toString(16).replace(/^-/, '');
        }
        return h;
    };
}
KJUR.asn1.ASN1Util = new KJURAsn1ASN1Util();
// ********************************************************************
//  Abstract ASN.1 Classes
// ********************************************************************
// ********************************************************************
/**
 * base class for ASN.1 DER encoder object
 * @name KJUR.asn1.ASN1Object
 * @class base class for ASN.1 DER encoder object
 * @property {Boolean} isModified flag whether internal data was changed
 * @property {String} hTLV hexadecimal string of ASN.1 TLV
 * @property {String} hT hexadecimal string of ASN.1 TLV tag(T)
 * @property {String} hL hexadecimal string of ASN.1 TLV length(L)
 * @property {String} hV hexadecimal string of ASN.1 TLV value(V)
 * @description
 */
KJUR.asn1.ASN1Object = function () {
    const hV = '';
    /**
     * get hexadecimal ASN.1 TLV length(L) bytes from TLV value(V)
     * @name getLengthHexFromValue
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV length(L)
     */
    this.getLengthHexFromValue = function () {
        if (typeof this.hV === 'undefined' || this.hV === null) {
            throw new Error('this.hV is null or undefined.');
        }
        if (this.hV.length % 2 == 1) {
            throw new Error('value hex must be even length: n=' + hV.length + ',v=' + this.hV);
        }
        const n = this.hV.length / 2;
        let hN = n.toString(16);
        if (hN.length % 2 === 1) {
            hN = '0' + hN;
        }
        if (n < 128) {
            return hN;
        }
        else {
            const hNlen = hN.length / 2;
            if (hNlen > 15) {
                throw new Error('ASN.1 length too long to represent by 8x: n = ' + n.toString(16));
            }
            const head = 128 + hNlen;
            return head.toString(16) + hN;
        }
    };
    /**
     * get hexadecimal string of ASN.1 TLV bytes
     * @name getEncodedHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV
     */
    this.getEncodedHex = function () {
        if (this.hTLV == null || this.isModified) {
            this.hV = this.getFreshValueHex();
            this.hL = this.getLengthHexFromValue();
            this.hTLV = this.hT + this.hL + this.hV;
            this.isModified = false;
            // console.error('first time: ' + this.hTLV);
        }
        return this.hTLV;
    };
    /**
     * get hexadecimal string of ASN.1 TLV value(V) bytes
     * @name getValueHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV value(V) bytes
     */
    this.getValueHex = function () {
        this.getEncodedHex();
        return this.hV;
    };
    this.getFreshValueHex = function () {
        return '';
    };
};
// == BEGIN DERAbstractString ================================================
/**
 * base class for ASN.1 DER string classes
 * @name KJUR.asn1.DERAbstractString
 * @class base class for ASN.1 DER string classes
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @property {String} s internal string of value
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERAbstractString = function (params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @return {String} string value of this string object
     */
    this.getString = function () {
        return this.s;
    };
    /**
     * set value by a hexadecimal string
     * @name setStringHex
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @param {String} newHexString value by a hexadecimal string to set
     */
    this.setStringHex = function (newHexString) {
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = newHexString;
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
    if (typeof params != 'undefined') {
        if (typeof params.str != 'undefined') {
            this.setString(params.str);
        }
        else if (typeof params.hex != 'undefined') {
            this.setStringHex(params.hex);
        }
    }
};
JSX.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
// == END   DERAbstractString ================================================
// == BEGIN DERAbstractTime ==================================================
/**
 * base class for ASN.1 DER Generalized/UTCTime class
 * @name KJUR.asn1.DERAbstractTime
 * @class base class for ASN.1 DER Generalized/UTCTime class
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractTime = function (params) {
    KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
    // --- PRIVATE METHODS --------------------
    this.localDateToUTC = function (d) {
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const utcDate = new Date(utc);
        return utcDate;
    };
    this.formatDate = function (dateObject, type) {
        const pad = this.zeroPadding;
        const d = this.localDateToUTC(dateObject);
        let year = String(d.getFullYear());
        if (type == 'utc') {
            year = year.substr(2, 2);
        }
        const month = pad(String(d.getMonth() + 1), 2);
        const day = pad(String(d.getDate()), 2);
        const hour = pad(String(d.getHours()), 2);
        const min = pad(String(d.getMinutes()), 2);
        const sec = pad(String(d.getSeconds()), 2);
        return year + month + day + hour + min + sec + 'Z';
    };
    this.zeroPadding = function (s, len) {
        if (s.length >= len) {
            return s;
        }
        return new Array(len - s.length + 1).join('0') + s;
    };
    // --- PUBLIC METHODS --------------------
    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @return {String} string value of this time object
     */
    this.getString = function () {
        return this.s;
    };
    /**
     * set value by a Date object
     * @name setByDateValue
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @param {Integer} year year of date (ex. 2013)
     * @param {Integer} month month of date between 1 and 12 (ex. 12)
     * @param {Integer} day day of month
     * @param {Integer} hour hours of date
     * @param {Integer} min minutes of date
     * @param {Integer} sec seconds of date
     */
    this.setByDateValue = function (year, month, day, hour, min, sec) {
        const dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
        this.setByDate(dateObject);
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
// == END   DERAbstractTime ==================================================
// == BEGIN DERAbstractStructured ============================================
/**
 * base class for ASN.1 DER structured class
 * @name KJUR.asn1.DERAbstractStructured
 * @class base class for ASN.1 DER structured class
 * @property {Array} asn1Array internal array of ASN1Object
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractStructured = function (params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    /**
     * set value by array of ASN1Object
     * @name setByASN1ObjectArray
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {array} asn1ObjectArray array of ASN1Object to set
     */
    this.setByASN1ObjectArray = function (asn1ObjectArray) {
        this.hTLV = null;
        this.isModified = true;
        this.asn1Array = asn1ObjectArray;
    };
    /**
     * append an ASN1Object to internal array
     * @name appendASN1Object
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {ASN1Object} asn1Object to add
     */
    this.appendASN1Object = function (asn1Object) {
        this.hTLV = null;
        this.isModified = true;
        this.asn1Array.push(asn1Object);
    };
    this.asn1Array = new Array();
    if (typeof params != 'undefined') {
        if (typeof params.array != 'undefined') {
            this.asn1Array = params.array;
        }
    }
};
JSX.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);
// ********************************************************************
//  ASN.1 Object Classes
// ********************************************************************
// ********************************************************************
/**
 * class for ASN.1 DER Boolean
 * @name KJUR.asn1.DERBoolean
 * @class class for ASN.1 DER Boolean
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERBoolean = function () {
    KJUR.asn1.DERBoolean.superclass.constructor.call(this);
    this.hT = '01';
    this.hTLV = '0101ff';
};
JSX.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);
// ********************************************************************
/**
 * class for ASN.1 DER Integer
 * @name KJUR.asn1.DERInteger
 * @class class for ASN.1 DER Integer
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>int - specify initial ASN.1 value(V) by integer value</li>
 * <li>bigint - specify initial ASN.1 value(V) by BigInteger object</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERInteger = function (params) {
    KJUR.asn1.DERInteger.superclass.constructor.call(this);
    this.hT = '02';
    /**
     * set value by Tom Wu's BigInteger object
     * @name setByBigInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {BigInteger} bigIntegerValue to set
     */
    this.setByBigInteger = function (bigIntegerValue) {
        this.hTLV = null;
        this.isModified = true;
        this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };
    /**
     * set value by integer value
     * @name setByInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {Integer} integer value to set
     */
    this.setByInteger = function (intValue) {
        const bi = new BigInteger(String(intValue), 10);
        this.setByBigInteger(bi);
    };
    /**
     * set value by integer value
     * @name setValueHex
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {String} hexadecimal string of integer value
     * @description
     * <br/>
     * NOTE: Value shall be represented by minimum octet length of
     * two's complement representation.
     */
    this.setValueHex = function (newHexString) {
        this.hV = newHexString;
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
    if (typeof params != 'undefined') {
        if (typeof params.bigint != 'undefined') {
            this.setByBigInteger(params.bigint);
        }
        else if (typeof params.int != 'undefined') {
            this.setByInteger(params.int);
        }
        else if (typeof params.hex != 'undefined') {
            this.setValueHex(params.hex);
        }
    }
};
JSX.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);
// ********************************************************************
/**
 * class for ASN.1 DER encoded BitString primitive
 * @name KJUR.asn1.DERBitString
 * @class class for ASN.1 DER encoded BitString primitive
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>bin - specify binary string (ex. '10111')</li>
 * <li>array - specify array of boolean (ex. [true,false,true,true])</li>
 * <li>hex - specify hexadecimal string of ASN.1 value(V) including unused bits</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERBitString = function (params) {
    KJUR.asn1.DERBitString.superclass.constructor.call(this);
    this.hT = '03';
    /**
     * set ASN.1 value(V) by a hexadecimal string including unused bits
     * @name setHexValueIncludingUnusedBits
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} newHexStringIncludingUnusedBits
     */
    this.setHexValueIncludingUnusedBits = function (newHexStringIncludingUnusedBits) {
        this.hTLV = null;
        this.isModified = true;
        this.hV = newHexStringIncludingUnusedBits;
    };
    /**
     * set ASN.1 value(V) by unused bit and hexadecimal string of value
     * @name setUnusedBitsAndHexValue
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} unusedBits
     * @param {String} hValue
     */
    this.setUnusedBitsAndHexValue = function (unusedBits, hValue) {
        if (unusedBits < 0 || 7 < unusedBits) {
            throw new Error('unused bits shall be from 0 to 7: u = ' + unusedBits);
        }
        const hUnusedBits = '0' + unusedBits;
        this.hTLV = null;
        this.isModified = true;
        this.hV = hUnusedBits + hValue;
    };
    /**
     * set ASN.1 DER BitString by binary string
     * @name setByBinaryString
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} binaryString binary value string (i.e. '10111')
     * @description
     * Its unused bits will be calculated automatically by length of
     * 'binaryValue'. <br/>
     * NOTE: Trailing zeros '0' will be ignored.
     */
    this.setByBinaryString = function (binaryString) {
        binaryString = binaryString.replace(/0+$/, '');
        let unusedBits = 8 - binaryString.length % 8;
        if (unusedBits == 8)
            unusedBits = 0;
        for (let i = 0; i <= unusedBits; i++) {
            binaryString += '0';
        }
        let h = '';
        for (let i = 0; i < binaryString.length - 1; i += 8) {
            const b = binaryString.substr(i, 8);
            let x = parseInt(b, 2).toString(16);
            if (x.length == 1) {
                x = '0' + x;
            }
            h += x;
        }
        this.hTLV = null;
        this.isModified = true;
        this.hV = '0' + unusedBits + h;
    };
    /**
     * set ASN.1 TLV value(V) by an array of boolean
     * @name setByBooleanArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {array} booleanArray array of boolean (ex. [true, false, true])
     * @description
     * NOTE: Trailing falses will be ignored.
     */
    this.setByBooleanArray = function (booleanArray) {
        let s = '';
        for (let i = 0; i < booleanArray.length; i++) {
            if (booleanArray[i] == true) {
                s += '1';
            }
            else {
                s += '0';
            }
        }
        this.setByBinaryString(s);
    };
    /**
     * generate an array of false with specified length
     * @name newFalseArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} nLength length of array to generate
     * @return {array} array of boolean faluse
     * @description
     * This static method may be useful to initialize boolean array.
     */
    this.newFalseArray = function (nLength) {
        const a = new Array(nLength);
        for (let i = 0; i < nLength; i++) {
            a[i] = false;
        }
        return a;
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
    if (typeof params != 'undefined') {
        if (typeof params.hex != 'undefined') {
            this.setHexValueIncludingUnusedBits(params.hex);
        }
        else if (typeof params.bin != 'undefined') {
            this.setByBinaryString(params.bin);
        }
        else if (typeof params.array != 'undefined') {
            this.setByBooleanArray(params.array);
        }
    }
};
JSX.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);
// ********************************************************************
/**
 * class for ASN.1 DER OctetString
 * @name KJUR.asn1.DEROctetString
 * @class class for ASN.1 DER OctetString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DEROctetString = function (params) {
    KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
    this.hT = '04';
};
JSX.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER Null
 * @name KJUR.asn1.DERNull
 * @class class for ASN.1 DER Null
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERNull = function () {
    KJUR.asn1.DERNull.superclass.constructor.call(this);
    this.hT = '05';
    this.hTLV = '0500';
};
JSX.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);
// ********************************************************************
/**
 * class for ASN.1 DER ObjectIdentifier
 * @name KJUR.asn1.DERObjectIdentifier
 * @class class for ASN.1 DER ObjectIdentifier
 * @param {Array} params associative array of parameters (ex. {'oid': '2.5.4.5'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>oid - specify initial ASN.1 value(V) by a oid string (ex. 2.5.4.13)</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERObjectIdentifier = function (params) {
    const itox = function (i) {
        let h = i.toString(16);
        if (h.length == 1) {
            h = '0' + h;
        }
        return h;
    };
    const roidtox = function (roid) {
        let h = '';
        const bi = new BigInteger(roid, 10);
        let b = bi.toString(2);
        let padLen = 7 - b.length % 7;
        if (padLen == 7)
            padLen = 0;
        let bPad = '';
        for (let i = 0; i < padLen; i++) {
            bPad += '0';
        }
        b = bPad + b;
        for (let i = 0; i < b.length - 1; i += 7) {
            let b8 = b.substr(i, 7);
            if (i != b.length - 7) {
                b8 = '1' + b8;
            }
            h += itox(parseInt(b8, 2));
        }
        return h;
    };
    KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
    this.hT = '06';
    /**
     * set value by a hexadecimal string
     * @name setValueHex
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} newHexString hexadecimal value of OID bytes
     */
    this.setValueHex = function (newHexString) {
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = newHexString;
    };
    /**
     * set value by a OID string
     * @name setValueOidString
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidString OID string (ex. 2.5.4.13)
     */
    this.setValueOidString = function (oidString) {
        if (!oidString.match(/^[0-9.]+$/)) {
            throw new Error('malformed oid string: ' + oidString);
        }
        let h = '';
        const a = oidString.split('.');
        const i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
        h += itox(i0);
        a.splice(0, 2);
        for (let i = 0; i < a.length; i++) {
            h += roidtox(a[i]);
        }
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = h;
    };
    /**
     * set value by a OID name
     * @name setValueName
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidName OID name (ex. 'serverAuth')
     * @since 1.0.1
     * @description
     * OID name shall be defined in 'KJUR.asn1.x509.OID.name2oidList'.
     * Otherwise raise error.
     */
    this.setValueName = function (oidName) {
        if (typeof KJUR.asn1.x509.OID.name2oidList[oidName] != 'undefined') {
            const oid = KJUR.asn1.x509.OID.name2oidList[oidName];
            this.setValueOidString(oid);
        }
        else {
            throw new Error('DERObjectIdentifier oidName undefined: ' + oidName);
        }
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
    if (typeof params != 'undefined') {
        if (typeof params.oid != 'undefined') {
            this.setValueOidString(params.oid);
        }
        else if (typeof params.hex != 'undefined') {
            this.setValueHex(params.hex);
        }
        else if (typeof params.name != 'undefined') {
            this.setValueName(params.name);
        }
    }
};
JSX.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);
// ********************************************************************
/**
 * class for ASN.1 DER UTF8String
 * @name KJUR.asn1.DERUTF8String
 * @class class for ASN.1 DER UTF8String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERUTF8String = function (params) {
    KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
    this.hT = '0c';
};
JSX.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER NumericString
 * @name KJUR.asn1.DERNumericString
 * @class class for ASN.1 DER NumericString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERNumericString = function (params) {
    KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
    this.hT = '12';
};
JSX.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER PrintableString
 * @name KJUR.asn1.DERPrintableString
 * @class class for ASN.1 DER PrintableString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERPrintableString = function (params) {
    KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
    this.hT = '13';
};
JSX.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER TeletexString
 * @name KJUR.asn1.DERTeletexString
 * @class class for ASN.1 DER TeletexString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERTeletexString = function (params) {
    KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
    this.hT = '14';
};
JSX.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER IA5String
 * @name KJUR.asn1.DERIA5String
 * @class class for ASN.1 DER IA5String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERIA5String = function (params) {
    KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
    this.hT = '16';
};
JSX.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);
// ********************************************************************
/**
 * class for ASN.1 DER UTCTime
 * @name KJUR.asn1.DERUTCTime
 * @class class for ASN.1 DER UTCTime
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 * <h4>EXAMPLES</h4>
 * @example
 * let d1 = new KJUR.asn1.DERUTCTime();
 * d1.setString('130430125959Z');
 *
 * let d2 = new KJUR.asn1.DERUTCTime({'str': '130430125959Z'});
 *
 * let d3 = new KJUR.asn1.DERUTCTime({'date': new Date(Date.UTC(2015, 0, 31, 0, 0, 0, 0))});
 */
KJUR.asn1.DERUTCTime = function (params) {
    KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
    this.hT = '17';
    if (typeof params != 'undefined') {
        if (typeof params.str != 'undefined') {
            this.setString(params.str);
        }
        else if (typeof params.hex != 'undefined') {
            this.setStringHex(params.hex);
        }
        else if (typeof params.date != 'undefined') {
            this.setByDate(params.date);
        }
    }
};
JSX.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);
// ********************************************************************
/**
 * class for ASN.1 DER GeneralizedTime
 * @name KJUR.asn1.DERGeneralizedTime
 * @class class for ASN.1 DER GeneralizedTime
 * @param {Array} params associative array of parameters (ex. {'str': '20130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'20130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERGeneralizedTime = function (params) {
    KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
    this.hT = '18';
    if (typeof params != 'undefined') {
        if (typeof params.str != 'undefined') {
            this.setString(params.str);
        }
        else if (typeof params.hex != 'undefined') {
            this.setStringHex(params.hex);
        }
        else if (typeof params.date != 'undefined') {
            this.setByDate(params.date);
        }
    }
};
JSX.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);
// ********************************************************************
/**
 * class for ASN.1 DER Sequence
 * @name KJUR.asn1.DERSequence
 * @class class for ASN.1 DER Sequence
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSequence = function (params) {
    KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
    this.hT = '30';
    this.getFreshValueHex = function () {
        let h = '';
        for (let i = 0; i < this.asn1Array.length; i++) {
            const asn1Obj = this.asn1Array[i];
            h += asn1Obj.getEncodedHex();
        }
        this.hV = h;
        return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);
// ********************************************************************
/**
 * class for ASN.1 DER Set
 * @name KJUR.asn1.DERSet
 * @class class for ASN.1 DER Set
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSet = function (params) {
    KJUR.asn1.DERSet.superclass.constructor.call(this, params);
    this.hT = '31';
    this.getFreshValueHex = function () {
        const a = new Array();
        for (let i = 0; i < this.asn1Array.length; i++) {
            const asn1Obj = this.asn1Array[i];
            a.push(asn1Obj.getEncodedHex());
        }
        a.sort();
        this.hV = a.join('');
        return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);
// ********************************************************************
/**
 * class for ASN.1 DER TaggedObject
 * @name KJUR.asn1.DERTaggedObject
 * @class class for ASN.1 DER TaggedObject
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * Parameter 'tagNoNex' is ASN.1 tag(T) value for this object.
 * For example, if you find '[1]' tag in a ASN.1 dump,
 * 'tagNoHex' will be 'a1'.
 * <br/>
 * As for optional argument 'params' for constructor, you can specify *ANY* of
 * following properties:
 * <ul>
 * <li>explicit - specify true if this is explicit tag otherwise false
 *     (default is 'true').</li>
 * <li>tag - specify tag (default is 'a0' which means [0])</li>
 * <li>obj - specify ASN1Object which is tagged</li>
 * </ul>
 * @example
 * d1 = new KJUR.asn1.DERUTF8String({'str':'a'});
 * d2 = new KJUR.asn1.DERTaggedObject({'obj': d1});
 * hex = d2.getEncodedHex();
 */
KJUR.asn1.DERTaggedObject = function (params) {
    KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
    this.hT = 'a0';
    this.hV = '';
    this.isExplicit = true;
    this.asn1Object = null;
    /**
     * set value by an ASN1Object
     * @name setString
     * @memberOf KJUR.asn1.DERTaggedObject
     * @function
     * @param {Boolean} isExplicitFlag flag for explicit/implicit tag
     * @param {Integer} tagNoHex hexadecimal string of ASN.1 tag
     * @param {ASN1Object} asn1Object ASN.1 to encapsulate
     */
    this.setASN1Object = function (isExplicitFlag, tagNoHex, asn1Object) {
        this.hT = tagNoHex;
        this.isExplicit = isExplicitFlag;
        this.asn1Object = asn1Object;
        if (this.isExplicit) {
            this.hV = this.asn1Object.getEncodedHex();
            this.hTLV = null;
            this.isModified = true;
        }
        else {
            this.hV = null;
            this.hTLV = asn1Object.getEncodedHex();
            this.hTLV = this.hTLV.replace(/^../, tagNoHex);
            this.isModified = false;
        }
    };
    this.getFreshValueHex = function () {
        return this.hV;
    };
    if (typeof params != 'undefined') {
        if (typeof params.tag != 'undefined') {
            this.hT = params.tag;
        }
        if (typeof params.explicit != 'undefined') {
            this.isExplicit = params.explicit;
        }
        if (typeof params.obj != 'undefined') {
            this.asn1Object = params.obj;
            this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
        }
    }
};
JSX.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);
// Hex JavaScript decoder
// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED 'AS IS' AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
(function (undefined) {
    let decoder;
    const pHex = {
        decode(a) {
            let i;
            if (decoder === undefined) {
                let hex = '0123456789ABCDEF';
                const ignore = ' \f\n\r\t\u00A0\u2028\u2029';
                decoder = [];
                for (i = 0; i < 16; ++i) {
                    decoder[hex.charAt(i)] = i;
                }
                hex = hex.toLowerCase();
                for (i = 10; i < 16; ++i) {
                    decoder[hex.charAt(i)] = i;
                }
                for (i = 0; i < ignore.length; ++i) {
                    decoder[ignore.charAt(i)] = -1;
                }
            }
            const out = [];
            let bits = 0, char_count = 0;
            for (i = 0; i < a.length; ++i) {
                let c = a.charAt(i);
                if (c == '=') {
                    break;
                }
                c = decoder[c];
                if (c == -1) {
                    continue;
                }
                if (c === undefined) {
                    throw new Error('Illegal character at offset ' + i);
                }
                bits |= c;
                if (++char_count >= 2) {
                    out[out.length.toString()] = bits;
                    bits = 0;
                    char_count = 0;
                }
                else {
                    bits <<= 4;
                }
            }
            if (char_count) {
                throw new Error('Hex encoding incomplete: 4 bits missing');
            }
            return out;
        }
    };
    // export globals
    window.Hex = pHex;
})();
// Base64 JavaScript decoder
// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED 'AS IS' AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
(function (undefined) {
    let decoder;
    const base64 = {};
    base64.decode = function (a) {
        let i;
        if (decoder === undefined) {
            const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            const ignore = '= \f\n\r\t\u00A0\u2028\u2029';
            decoder = [];
            for (i = 0; i < 64; ++i) {
                decoder[b64.charAt(i)] = i;
            }
            for (i = 0; i < ignore.length; ++i) {
                decoder[ignore.charAt(i)] = -1;
            }
        }
        const out = [];
        let bits = 0, char_count = 0;
        for (i = 0; i < a.length; ++i) {
            let c = a.charAt(i);
            if (c == '=') {
                break;
            }
            c = decoder[c];
            if (c == -1) {
                continue;
            }
            if (c === undefined) {
                throw new Error('Illegal character at offset ' + i);
            }
            bits |= c;
            if (++char_count >= 4) {
                out[out.length.toString()] = (bits >> 16);
                out[out.length.toString()] = (bits >> 8) & 0xFF;
                out[out.length.toString()] = bits & 0xFF;
                bits = 0;
                char_count = 0;
            }
            else {
                bits <<= 6;
            }
        }
        switch (char_count) {
            case 1:
                throw new Error('Base64 encoding incomplete: at least 2 bits missing');
            case 2:
                out[out.length.toString()] = (bits >> 10);
                break;
            case 3:
                out[out.length.toString()] = (bits >> 16);
                out[out.length.toString()] = (bits >> 8) & 0xFF;
                break;
        }
        return out;
    };
    base64.re = /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/;
    base64.unarmor = function (a) {
        const m = base64.re.exec(a);
        if (m) {
            if (m[1]) {
                a = m[1];
            }
            else if (m[2]) {
                a = m[2];
            }
            else {
                throw new Error('RegExp out of sync');
            }
        }
        return base64.decode(a);
    };
    // export globals
    window.Base64 = base64;
})();
// ASN.1 JavaScript decoder
// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED 'AS IS' AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
/*global oids */
(function (undefined) {
    const hardLimit = 100;
    const ellipsis = '\u2026';
    function Stream(enc, pos) {
        if (enc instanceof Stream) {
            this.enc = enc.enc;
            this.pos = enc.pos;
        }
        else {
            this.enc = enc;
            this.pos = pos;
        }
    }
    Stream.prototype.get = function (pos) {
        if (pos === undefined) {
            pos = this.pos++;
        }
        if (pos >= this.enc.length) {
            throw new Error('Requesting byte offset ' + pos + ' on a stream of length ' + this.enc.length);
        }
        return this.enc[pos];
    };
    Stream.prototype.hexDigits = '0123456789ABCDEF';
    Stream.prototype.hexByte = function (b) {
        return this.hexDigits.charAt((b >> 4) & 0xF) + this.hexDigits.charAt(b & 0xF);
    };
    Stream.prototype.hexDump = function (start, end, raw) {
        let s = '';
        for (let i = start; i < end; ++i) {
            s += this.hexByte(this.get(i));
            if (raw !== true) {
                switch (i & 0xF) {
                    case 0x7:
                        s += '  ';
                        break;
                    case 0xF:
                        s += '\n';
                        break;
                    default: s += ' ';
                }
            }
        }
        return s;
    };
    Stream.prototype.parseStringISO = function (start, end) {
        let s = '';
        for (let i = start; i < end; ++i) {
            s += String.fromCharCode(this.get(i));
        }
        return s;
    };
    Stream.prototype.parseStringUTF = function (start, end) {
        let s = '';
        for (let i = start; i < end;) {
            const c = this.get(i++);
            if (c < 128) {
                s += String.fromCharCode(c);
            }
            else if ((c > 191) && (c < 224)) {
                s += String.fromCharCode(((c & 0x1F) << 6) | (this.get(i++) & 0x3F));
            }
            else {
                s += String.fromCharCode(((c & 0x0F) << 12) | ((this.get(i++) & 0x3F) << 6) | (this.get(i++) & 0x3F));
            }
        }
        return s;
    };
    Stream.prototype.parseStringBMP = function (start, end) {
        let str = '';
        for (let i = start; i < end; i += 2) {
            const high_byte = this.get(i);
            const low_byte = this.get(i + 1);
            str += String.fromCharCode((high_byte << 8) + low_byte);
        }
        return str;
    };
    Stream.prototype.reTime = /^((?:1[89]|2\d)?\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
    Stream.prototype.parseTime = function (start, end) {
        let s = this.parseStringISO(start, end);
        const m = this.reTime.exec(s);
        if (!m) {
            return 'Unrecognized time: ' + s;
        }
        s = m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4];
        if (m[5]) {
            s += ':' + m[5];
            if (m[6]) {
                s += ':' + m[6];
                if (m[7]) {
                    s += '.' + m[7];
                }
            }
        }
        if (m[8]) {
            s += ' UTC';
            if (m[8] != 'Z') {
                s += m[8];
                if (m[9]) {
                    s += ':' + m[9];
                }
            }
        }
        return s;
    };
    Stream.prototype.parseInteger = function (start, end) {
        // TODO support negative numbers
        let len = end - start;
        if (len > 4) {
            len <<= 3;
            let s = this.get(start);
            if (s === 0) {
                len -= 8;
            }
            else {
                while (s < 128) {
                    s <<= 1;
                    --len;
                }
            }
            return '(' + len + ' bit)';
        }
        let n = 0;
        for (let i = start; i < end; ++i) {
            n = (n << 8) | this.get(i);
        }
        return n;
    };
    Stream.prototype.parseBitString = function (start, end) {
        let unusedBit = this.get(start);
        let lenBit = ((end - start - 1) << 3) - unusedBit;
        let s = '(' + lenBit + ' bit)';
        if (lenBit <= 20) {
            let skip = unusedBit;
            s += ' ';
            for (let i = end - 1; i > start; --i) {
                let b = this.get(i);
                for (let j = skip; j < 8; ++j) {
                    s += (b >> j) & 1 ? '1' : '0';
                }
                skip = 0;
            }
        }
        return s;
    };
    Stream.prototype.parseOctetString = function (start, end) {
        let len = end - start;
        let s = '(' + len + ' byte) ';
        if (len > hardLimit) {
            end = start + hardLimit;
        }
        for (let i = start; i < end; ++i) {
            // TODO: also try Latin1?
            s += this.hexByte(this.get(i));
        }
        if (len > hardLimit) {
            s += ellipsis;
        }
        return s;
    };
    Stream.prototype.parseOID = function (start, end) {
        let s = '';
        let n = 0;
        let bits = 0;
        for (let i = start; i < end; ++i) {
            const v = this.get(i);
            n = (n << 7) | (v & 0x7F);
            bits += 7;
            if (!(v & 0x80)) {
                if (s === '') {
                    const m = n < 80 ? n < 40 ? 0 : 1 : 2;
                    s = m + '.' + (n - m * 40);
                }
                else {
                    s += '.' + ((bits >= 31) ? 'bigint' : n);
                }
                n = bits = 0;
            }
        }
        return s;
    };
    function ASN1(stream, header, length, tag, sub) {
        this.stream = stream;
        this.header = header;
        this.length = length;
        this.tag = tag;
        this.sub = sub;
    }
    ASN1.prototype.typeName = function () {
        if (this.tag === undefined) {
            return 'unknown';
        }
        const tagClass = this.tag >> 6;
        const tagNumber = this.tag & 0x1F;
        switch (tagClass) {
            case 0:// universal
                switch (tagNumber) {
                    case 0x00: return 'EOC';
                    case 0x01: return 'BOOLEAN';
                    case 0x02: return 'INTEGER';
                    case 0x03: return 'BIT_STRING';
                    case 0x04: return 'OCTET_STRING';
                    case 0x05: return 'NULL';
                    case 0x06: return 'OBJECT_IDENTIFIER';
                    case 0x07: return 'ObjectDescriptor';
                    case 0x08: return 'EXTERNAL';
                    case 0x09: return 'REAL';
                    case 0x0A: return 'ENUMERATED';
                    case 0x0B: return 'EMBEDDED_PDV';
                    case 0x0C: return 'UTF8String';
                    case 0x10: return 'SEQUENCE';
                    case 0x11: return 'SET';
                    case 0x12: return 'NumericString';
                    case 0x13: return 'PrintableString'; // ASCII subset
                    case 0x14: return 'TeletexString'; // aka T61String
                    case 0x15: return 'VideotexString';
                    case 0x16: return 'IA5String'; // ASCII
                    case 0x17: return 'UTCTime';
                    case 0x18: return 'GeneralizedTime';
                    case 0x19: return 'GraphicString';
                    case 0x1A: return 'VisibleString'; // ASCII subset
                    case 0x1B: return 'GeneralString';
                    case 0x1C: return 'UniversalString';
                    case 0x1E: return 'BMPString';
                    default: return 'Universal_' + tagNumber.toString(16);
                }
            case 1: return 'Application_' + tagNumber.toString(16);
            case 2: return '[' + tagNumber + ']'; // Context
            case 3: return 'Private_' + tagNumber.toString(16);
        }
    };
    ASN1.prototype.reSeemsASCII = /^[ -~]+$/;
    ASN1.prototype.content = function () {
        if (this.tag === undefined) {
            return null;
        }
        const tagClass = this.tag >> 6;
        const tagNumber = this.tag & 0x1F;
        const content = this.posContent();
        const len = Math.abs(this.length);
        if (tagClass !== 0) {
            if (this.sub !== null) {
                return '(' + this.sub.length + ' elem)';
            }
            // TODO: TRY TO PARSE ASCII STRING
            const s = this.stream.parseStringISO(content, content + Math.min(len, hardLimit));
            if (this.reSeemsASCII.test(s)) {
                return s.substring(0, 2 * hardLimit) + ((s.length > 2 * hardLimit) ? ellipsis : '');
            }
            else {
                return this.stream.parseOctetString(content, content + len);
            }
        }
        switch (tagNumber) {
            case 0x01:
                // BOOLEAN
                return (this.stream.get(content) === 0) ? 'false' : 'true';
            case 0x02:
                // INTEGER
                return this.stream.parseInteger(content, content + len);
            case 0x03:
                // BIT_STRING
                return this.sub ? '(' + this.sub.length + ' elem)' :
                    this.stream.parseBitString(content, content + len);
            case 0x04:
                // OCTET_STRING
                return this.sub ? '(' + this.sub.length + ' elem)' :
                    this.stream.parseOctetString(content, content + len);
            // case 0x05: // NULL
            case 0x06:
                // OBJECT_IDENTIFIER
                return this.stream.parseOID(content, content + len);
            // case 0x07: // ObjectDescriptor
            // case 0x08: // EXTERNAL
            // case 0x09: // REAL
            // case 0x0A: // ENUMERATED
            // case 0x0B: // EMBEDDED_PDV
            case 0x10:
            // SEQUENCE
            case 0x11:
                // SET
                return '(' + this.sub.length + ' elem)';
            case 0x0C:
                // UTF8String
                return this.stream.parseStringUTF(content, content + len);
            case 0x12:
            // NumericString
            case 0x13:
            // PrintableString
            case 0x14:
            // TeletexString
            case 0x15:
            // VideotexString
            case 0x16:
            // IA5String
            // case 0x19: // GraphicString
            case 0x1A:
                // VisibleString
                // case 0x1B: // GeneralString
                // case 0x1C: // UniversalString
                return this.stream.parseStringISO(content, content + len);
            case 0x1E:
                // BMPString
                return this.stream.parseStringBMP(content, content + len);
            case 0x17:
            // UTCTime
            case 0x18:
                // GeneralizedTime
                return this.stream.parseTime(content, content + len);
        }
        return null;
    };
    ASN1.prototype.toString = function () {
        return this.typeName() + '@' + this.stream.pos + '[header:' + this.header + ',length:' + this.length + ',sub:' + ((this.sub === null) ? 'null' : this.sub.length) + ']';
    };
    ASN1.prototype.print = function (indent) {
        if (indent === undefined) {
            indent = '';
        }
        document.writeln(indent + this);
        if (this.sub !== null) {
            indent += '  ';
            for (let i = 0, max = this.sub.length; i < max; ++i) {
                this.sub[i].print(indent);
            }
        }
    };
    ASN1.prototype.toPrettyString = function (indent) {
        if (indent === undefined) {
            indent = '';
        }
        let s = indent + this.typeName() + ' @' + this.stream.pos;
        if (this.length >= 0) {
            s += '+';
        }
        s += this.length;
        if (this.tag & 0x20) {
            s += ' (constructed)';
        }
        else if (((this.tag == 0x03) || (this.tag == 0x04)) && (this.sub !== null)) {
            s += ' (encapsulates)';
        }
        s += '\n';
        if (this.sub !== null) {
            indent += '  ';
            for (let i = 0, max = this.sub.length; i < max; ++i) {
                s += this.sub[i].toPrettyString(indent);
            }
        }
        return s;
    };
    ASN1.prototype.posStart = function () {
        return this.stream.pos;
    };
    ASN1.prototype.posContent = function () {
        return this.stream.pos + this.header;
    };
    ASN1.prototype.posEnd = function () {
        return this.stream.pos + this.header + Math.abs(this.length);
    };
    ASN1.prototype.fakeHover = function (current) {
        this.node.className += ' hover';
        if (current) {
            this.head.className += ' hover';
        }
    };
    ASN1.prototype.fakeOut = function (current) {
        const re = / ?hover/;
        this.node.className = this.node.className.replace(re, '');
        if (current) {
            this.head.className = this.head.className.replace(re, '');
        }
    };
    ASN1.prototype.toHexString = function (root) {
        return this.stream.hexDump(this.posStart(), this.posEnd(), true);
    };
    const decodeLength = function (stream) {
        let buf = stream.get();
        const len = buf & 0x7F;
        if (len == buf) {
            return len;
        }
        if (len > 3) {
            throw new Error('Length over 24 bits not supported at position ' + (stream.pos - 1));
        }
        if (len === 0) {
            return -1; // undefined
        }
        buf = 0;
        for (let i = 0; i < len; ++i) {
            buf = (buf << 8) | stream.get();
        }
        return buf;
    };
    const hasContent = function (tag, len, stream) {
        if (tag & 0x20) {
            // constructed
            return true;
        }
        if ((tag < 0x03) || (tag > 0x04)) {
            return false;
        }
        const p = new Stream(stream);
        // BitString unused bits, must be in [0, 7]
        if (tag == 0x03) {
            p.get();
        }
        const subTag = p.get();
        if ((subTag >> 6) & 0x01) {
            // not (universal or context)
            return false;
        }
        try {
            const subLength = decodeLength(p);
            return ((p.pos - stream.pos) + subLength == len);
        }
        catch (exception) {
            return false;
        }
    };
    const ASN1Decode = function (stream) {
        if (!(stream instanceof Stream)) {
            stream = new Stream(stream, 0);
        }
        const streamStart = new Stream(stream);
        const tag = stream.get();
        let len = decodeLength(stream);
        let sub = null;
        const header = stream.pos - streamStart.pos;
        if (hasContent(tag, len, stream)) {
            // it has content, so we decode it
            const start = stream.pos;
            if (tag == 0x03) {
                stream.get(); // skip BitString unused bits, must be in [0, 7]
            }
            sub = [];
            if (len >= 0) {
                // definite length
                const end = start + len;
                while (stream.pos < end) {
                    sub[sub.length] = ASN1Decode(stream);
                }
                if (stream.pos != end) {
                    throw new Error('Content size is not correct for container starting at offset ' + start);
                }
            }
            else {
                // undefined length
                try {
                    for (;;) {
                        const s = ASN1Decode(stream);
                        if (s.tag === 0) {
                            break;
                        }
                        sub[sub.length] = s;
                    }
                    len = start - stream.pos;
                }
                catch (e) {
                    throw new Error('Exception while decoding undefined length content: ' + e);
                }
            }
        }
        else {
            // skip content
            stream.pos += len;
        }
        return new ASN1(streamStart, header, len, tag, sub);
    };
    // export globals
    window.ASN1 = ASN1;
    window.ASN1Decode = ASN1Decode;
})();
/**
 * Retrieve the hexadecimal value (as a string) of the current ASN.1 element
 * @returns {string}
 * @public
 */
const ASN1 = window.ASN1;
const Hex = window.Hex;
const Base64 = window.Base64;
ASN1.prototype.getHexStringValue = function () {
    const hexString = this.toHexString();
    const offset = this.header * 2;
    const length = this.length * 2;
    return hexString.substr(offset, length);
};
/**
 * Method to parse a pem encoded string containing both a public or private key.
 * The method will translate the pem encoded string in a der encoded string and
 * will parse private key and public key parameters. This method accepts public key
 * in the rsaencryption pkcs #1 format (oid: 1.2.840.113549.1.1.1).
 *
 * @todo Check how many rsa formats use the same format of pkcs #1.
 *
 * The format is defined as:
 * PublicKeyInfo ::= SEQUENCE {
 *   algorithm       AlgorithmIdentifier,
 *   PublicKey       BIT STRING
 * }
 * Where AlgorithmIdentifier is:
 * AlgorithmIdentifier ::= SEQUENCE {
 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
 * }
 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
 * RSAPublicKey ::= SEQUENCE {
 *   modulus           INTEGER,  -- n
 *   publicExponent    INTEGER   -- e
 * }
 * it's possible to examine the structure of the keys obtained from openssl using
 * an asn.1 dumper as the one used here to parse the components: http://lapo.it/asn1js/
 * @argument {string} pem the pem encoded string, can include the BEGIN/END header/footer
 * @private
 */
RSAKey.prototype.parseKey = function (pem) {
    try {
        let modulus = 0;
        let public_exponent = 0;
        const reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
        const der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
        let asn1 = window.ASN1Decode(der);
        // Fixes a bug with OpenSSL 1.0+ private keys
        if (asn1.sub.length === 3) {
            asn1 = asn1.sub[2].sub[0];
        }
        if (asn1.sub.length === 9) {
            // Parse the private key.
            modulus = asn1.sub[1].getHexStringValue(); // bigint
            this.n = parseBigInt(modulus, 16);
            public_exponent = asn1.sub[2].getHexStringValue(); // int
            this.e = parseInt(String(public_exponent), 16);
            const private_exponent = asn1.sub[3].getHexStringValue(); // bigint
            this.d = parseBigInt(private_exponent, 16);
            const prime1 = asn1.sub[4].getHexStringValue(); // bigint
            this.p = parseBigInt(prime1, 16);
            const prime2 = asn1.sub[5].getHexStringValue(); // bigint
            this.q = parseBigInt(prime2, 16);
            const exponent1 = asn1.sub[6].getHexStringValue(); // bigint
            this.dmp1 = parseBigInt(exponent1, 16);
            const exponent2 = asn1.sub[7].getHexStringValue(); // bigint
            this.dmq1 = parseBigInt(exponent2, 16);
            const coefficient = asn1.sub[8].getHexStringValue(); // bigint
            this.coeff = parseBigInt(coefficient, 16);
        }
        else if (asn1.sub.length === 2) {
            // Parse the public key.
            const bit_string = asn1.sub[1];
            const sequence = bit_string.sub[0];
            modulus = sequence.sub[0].getHexStringValue();
            this.n = parseBigInt(modulus, 16);
            public_exponent = sequence.sub[1].getHexStringValue();
            this.e = parseInt(public_exponent.toString(), 16);
        }
        else {
            return false;
        }
        return true;
    }
    catch (ex) {
        return false;
    }
};
/**
 * Translate rsa parameters in a hex encoded string representing the rsa key.
 *
 * The translation follow the ASN.1 notation :
 * RSAPrivateKey ::= SEQUENCE {
 *   version           Version,
 *   modulus           INTEGER,  -- n
 *   publicExponent    INTEGER,  -- e
 *   privateExponent   INTEGER,  -- d
 *   prime1            INTEGER,  -- p
 *   prime2            INTEGER,  -- q
 *   exponent1         INTEGER,  -- d mod (p1)
 *   exponent2         INTEGER,  -- d mod (q-1)
 *   coefficient       INTEGER,  -- (inverse of q) mod p
 * }
 * @returns {string}  DER Encoded String representing the rsa private key
 * @private
 */
RSAKey.prototype.getPrivateBaseKey = function () {
    const options = {
        array: [
            new KJUR.asn1.DERInteger({ int: 0 }),
            new KJUR.asn1.DERInteger({ bigint: this.n }),
            new KJUR.asn1.DERInteger({ int: this.e }),
            new KJUR.asn1.DERInteger({ bigint: this.d }),
            new KJUR.asn1.DERInteger({ bigint: this.p }),
            new KJUR.asn1.DERInteger({ bigint: this.q }),
            new KJUR.asn1.DERInteger({ bigint: this.dmp1 }),
            new KJUR.asn1.DERInteger({ bigint: this.dmq1 }),
            new KJUR.asn1.DERInteger({ bigint: this.coeff })
        ]
    };
    const seq = new KJUR.asn1.DERSequence(options);
    return seq.getEncodedHex();
};
/**
 * base64 (pem) encoded version of the DER encoded representation
 * @returns {string} pem encoded representation without header and footer
 * @public
 */
RSAKey.prototype.getPrivateBaseKeyB64 = function () {
    return hex2b64(this.getPrivateBaseKey());
};
/**
 * Translate rsa parameters in a hex encoded string representing the rsa public key.
 * The representation follow the ASN.1 notation :
 * PublicKeyInfo ::= SEQUENCE {
 *   algorithm       AlgorithmIdentifier,
 *   PublicKey       BIT STRING
 * }
 * Where AlgorithmIdentifier is:
 * AlgorithmIdentifier ::= SEQUENCE {
 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
 * }
 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
 * RSAPublicKey ::= SEQUENCE {
 *   modulus           INTEGER,  -- n
 *   publicExponent    INTEGER   -- e
 * }
 * @returns {string} DER Encoded String representing the rsa public key
 * @private
 */
RSAKey.prototype.getPublicBaseKey = function () {
    let options = {
        array: [
            new KJUR.asn1.DERObjectIdentifier({ oid: '1.2.840.113549.1.1.1' }),
            new KJUR.asn1.DERNull()
        ]
    };
    const first_sequence = new KJUR.asn1.DERSequence(options);
    options = {
        array: [
            new KJUR.asn1.DERInteger({ bigint: this.n }),
            new KJUR.asn1.DERInteger({ int: this.e })
        ]
    };
    const second_sequence = new KJUR.asn1.DERSequence(options);
    options = {
        hex: '00' + second_sequence.getEncodedHex()
    };
    const bit_string = new KJUR.asn1.DERBitString(options);
    options = {
        array: [
            first_sequence,
            bit_string
        ]
    };
    const seq = new KJUR.asn1.DERSequence(options);
    return seq.getEncodedHex();
};
/**
 * base64 (pem) encoded version of the DER encoded representation
 * @returns {string} pem encoded representation without header and footer
 * @public
 */
RSAKey.prototype.getPublicBaseKeyB64 = function () {
    return hex2b64(this.getPublicBaseKey());
};
/**
 * wrap the string in block of width chars. The default value for rsa keys is 64
 * characters.
 * @param {string} str the pem encoded string without header and footer
 * @param {Number} [width=64] - the length the string has to be wrapped at
 * @returns {string}
 * @private
 */
RSAKey.prototype.wordwrap = function (str, width) {
    width = width || 64;
    if (!str) {
        return str;
    }
    const regex = '(.{1,' + width + '})( +|$\n?)|(.{1,' + width + '})';
    return str.match(RegExp(regex, 'g')).join('\n');
};
/**
 * Retrieve the pem encoded private key
 * @returns {string} the pem encoded private key with header/footer
 * @public
 */
RSAKey.prototype.getPrivateKey = function () {
    let key = '-----BEGIN RSA PRIVATE KEY-----\n';
    key += this.wordwrap(this.getPrivateBaseKeyB64()) + '\n';
    key += '-----END RSA PRIVATE KEY-----';
    return key;
};
/**
 * Retrieve the pem encoded public key
 * @returns {string} the pem encoded public key with header/footer
 * @public
 */
RSAKey.prototype.getPublicKey = function () {
    let key = '-----BEGIN PUBLIC KEY-----\n';
    key += this.wordwrap(this.getPublicBaseKeyB64()) + '\n';
    key += '-----END PUBLIC KEY-----';
    return key;
};
/**
 * Check if the object contains the necessary parameters to populate the rsa modulus
 * and public exponent parameters.
 * @param {Object} [obj={}] - An object that may contain the two public key
 * parameters
 * @returns {boolean} true if the object contains both the modulus and the public exponent
 * properties (n and e)
 * @todo check for types of n and e. N should be a parseable bigInt object, E should
 * be a parseable integer number
 * @private
 */
RSAKey.prototype.hasPublicKeyProperty = function (obj) {
    obj = obj || {};
    return (obj.hasOwnProperty('n') &&
        obj.hasOwnProperty('e'));
};
/**
 * Check if the object contains ALL the parameters of an RSA key.
 * @param {Object} [obj={}] - An object that may contain nine rsa key
 * parameters
 * @returns {boolean} true if the object contains all the parameters needed
 * @todo check for types of the parameters all the parameters but the public exponent
 * should be parseable bigint objects, the public exponent should be a parseable integer number
 * @private
 */
RSAKey.prototype.hasPrivateKeyProperty = function (obj) {
    obj = obj || {};
    return (obj.hasOwnProperty('n') &&
        obj.hasOwnProperty('e') &&
        obj.hasOwnProperty('d') &&
        obj.hasOwnProperty('p') &&
        obj.hasOwnProperty('q') &&
        obj.hasOwnProperty('dmp1') &&
        obj.hasOwnProperty('dmq1') &&
        obj.hasOwnProperty('coeff'));
};
/**
 * Parse the properties of obj in the current rsa object. Obj should AT LEAST
 * include the modulus and public exponent (n, e) parameters.
 * @param {Object} obj - the object containing rsa parameters
 * @private
 */
RSAKey.prototype.parsePropertiesFrom = function (obj) {
    this.n = obj.n;
    this.e = obj.e;
    if (obj.hasOwnProperty('d')) {
        this.d = obj.d;
        this.p = obj.p;
        this.q = obj.q;
        this.dmp1 = obj.dmp1;
        this.dmq1 = obj.dmq1;
        this.coeff = obj.coeff;
    }
};
/**
 * Create a new JSEncryptRSAKey that extends Tom Wu's RSA key object.
 * This object is just a decorator for parsing the key parameter
 * @param {string|Object} key - The key in string format, or an object containing
 * the parameters needed to build a RSAKey object.
 * @constructor
 */
const JSEncryptRSAKey = function (key) {
    // Call the super constructor.
    RSAKey.call(this);
    // If a key key was provided.
    if (key) {
        // If this is a string...
        if (typeof key === 'string') {
            this.parseKey(key);
        }
        else if (this.hasPrivateKeyProperty(key) ||
            this.hasPublicKeyProperty(key)) {
            // Set the values for the key.
            this.parsePropertiesFrom(key);
        }
    }
};
// Derive from RSAKey.
JSEncryptRSAKey.prototype = new RSAKey();
// Reset the contructor.
JSEncryptRSAKey.prototype.constructor = JSEncryptRSAKey;
/**
 *
 * @param {Object} [options = {}] - An object to customize JSEncrypt behaviour
 * possible parameters are:
 * - default_key_size        {number}  default: 1024 the key size in bit
 * - default_public_exponent {string}  default: '010001' the hexadecimal representation of the public exponent
 * - log                     {boolean} default: false whether log warn/error or not
 * @constructor
 */
const JSEncrypt = function (options = {}) {
    options = options || {};
    this.default_key_size = parseInt(options.default_key_size) || 1024;
    this.default_public_exponent = options.default_public_exponent || '010001'; // 65537 default openssl public exponent for rsa key type
    this.log = options.log || false;
    // The private and public key.
    this.key = null;
};
/**
 * Method to set the rsa key parameter (one method is enough to set both the public
 * and the private key, since the private key contains the public key paramenters)
 * Log a warning if logs are enabled
 * @param {Object|string} key the pem encoded string or an object (with or without header/footer)
 * @public
 */
JSEncrypt.prototype.setKey = function (key) {
    if (this.log && this.key) {
        console.warn('A key was already set, overriding existing.');
    }
    this.key = new JSEncryptRSAKey(key);
};
/**
 * Proxy method for setKey, for api compatibility
 * @see setKey
 * @public
 */
JSEncrypt.prototype.setPrivateKey = function (privkey) {
    // Create the key.
    this.setKey(privkey);
};
/**
 * Proxy method for setKey, for api compatibility
 * @see setKey
 * @public
 */
JSEncrypt.prototype.setPublicKey = function (pubkey) {
    // Sets the public key.
    this.setKey(pubkey);
};
/**
 * Proxy method for RSAKey object's decrypt, decrypt the string using the private
 * components of the rsa key object. Note that if the object was not set will be created
 * on the fly (by the getKey method) using the parameters passed in the JSEncrypt constructor
 * @param {string} string base64 encoded crypted string to decrypt
 * @return {string} the decrypted string
 * @public
 */
JSEncrypt.prototype.decrypt = function (string) {
    // Return the decrypted string.
    try {
        return this.getKey().decrypt(b64tohex(string));
    }
    catch (ex) {
        return false;
    }
};
/**
 * Proxy method for RSAKey object's encrypt, encrypt the string using the public
 * components of the rsa key object. Note that if the object was not set will be created
 * on the fly (by the getKey method) using the parameters passed in the JSEncrypt constructor
 * @param {string} string the string to encrypt
 * @return {string} the encrypted string encoded in base64
 * @public
 */
JSEncrypt.prototype.encrypt = function (string) {
    // Return the encrypted string.
    try {
        return hex2b64(this.getKey().encrypt(string));
    }
    catch (ex) {
        return false;
    }
};
/**
 * Getter for the current JSEncryptRSAKey object. If it doesn't exists a new object
 * will be created and returned
 * @param {callback} [cb] the callback to be called if we want the key to be generated
 * in an async fashion
 * @returns {JSEncryptRSAKey} the JSEncryptRSAKey object
 * @public
 */
JSEncrypt.prototype.getKey = function (cb) {
    // Only create new if it does not exist.
    if (!this.key) {
        // Get a new private key.
        this.key = new JSEncryptRSAKey();
        if (cb && {}.toString.call(cb) === '[object Function]') {
            this.key.generateAsync(this.default_key_size, this.default_public_exponent, cb);
            return;
        }
        // Generate the key.
        this.key.generate(this.default_key_size, this.default_public_exponent);
    }
    return this.key;
};
/**
 * Returns the pem encoded representation of the private key
 * If the key doesn't exists a new key will be created
 * @returns {string} pem encoded representation of the private key WITH header and footer
 * @public
 */
JSEncrypt.prototype.getPrivateKey = function () {
    // Return the private representation of this key.
    return this.getKey().getPrivateKey();
};
/**
 * Returns the pem encoded representation of the private key
 * If the key doesn't exists a new key will be created
 * @returns {string} pem encoded representation of the private key WITHOUT header and footer
 * @public
 */
JSEncrypt.prototype.getPrivateKeyB64 = function () {
    // Return the private representation of this key.
    return this.getKey().getPrivateBaseKeyB64();
};
/**
 * Returns the pem encoded representation of the public key
 * If the key doesn't exists a new key will be created
 * @returns {string} pem encoded representation of the public key WITH header and footer
 * @public
 */
JSEncrypt.prototype.getPublicKey = function () {
    // Return the private representation of this key.
    return this.getKey().getPublicKey();
};
/**
 * Returns the pem encoded representation of the public key
 * If the key doesn't exists a new key will be created
 * @returns {string} pem encoded representation of the public key WITHOUT header and footer
 * @public
 */
JSEncrypt.prototype.getPublicKeyB64 = function () {
    // Return the private representation of this key.
    return this.getKey().getPublicBaseKeyB64();
};
export default JSEncrypt;
