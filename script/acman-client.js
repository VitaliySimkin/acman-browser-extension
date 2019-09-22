(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],7:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":5,"./encode":6}],8:[function(require,module,exports){
const a = require("./src/index.js");
window.MYAPI = a;
},{"./src/index.js":28}],9:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],10:[function(require,module,exports){
/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = require('component-emitter');
var RequestBase = require('./request-base');
var isObject = require('./is-object');
var ResponseBase = require('./response-base');
var shouldRetry = require('./should-retry');

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function(method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only version of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    if (index === -1) { // could be empty line, just skip it
      continue;
    }
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
      status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD'
      ? this._parseBody(this.text ? this.text : this.xhr.response)
      : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if(this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      }
    } catch(custom_err) {
      new_err = custom_err; // ok() callback can throw
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
    options = pass;
  }
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto',
    }
  }

  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;

    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', 'Bearer ' + user);
    break;
  }
  return this;
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options){
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  // console.log(this._retries, this._maxRetries)
  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function(){
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
}

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // querystring
  this._finalizeQueryString();

  return this._end();
};

Request.prototype._end = function() {
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts();

  // state change
  xhr.onreadystatechange = function(){
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // initiate request
  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;

    if (this.header.hasOwnProperty(field))
      xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, data, fn){
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":11,"./request-base":12,"./response-base":13,"./should-retry":14,"component-emitter":9}],11:[function(require,module,exports){
'use strict';

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],12:[function(require,module,exports){
'use strict';

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout(){
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options){
  if (!options || 'object' !== typeof options) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for(var option in options) {
    switch(option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;
      case 'response':
        this._responseTimeout = options.response;
        break;
      default:
        console.warn("Unknown timeout option", option);
    }
  }
  return this;
};

/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.retry = function retry(count){
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  return this;
};

/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */

RequestBase.prototype._retry = function() {
  this.clearTimeout();

  // node
  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;

  return this._end();
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

RequestBase.prototype.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
}

RequestBase.prototype.ok = function(cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function(res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function(on){
  // This is browser-only functionality. Node side is no-op.
  if(on==undefined) on = true;
  this._withCredentials = on;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n
 * @return {Request} for chaining
 */
RequestBase.prototype.maxResponseSize = function(n){
  if ('number' !== typeof n) {
    throw TypeError("Invalid argument");
  }
  this._maxResponseSize = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};


/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function(data){
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};


/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function(sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */
RequestBase.prototype._finalizeQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }
  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if ('function' === typeof this._sort) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

// For backwards compat only
RequestBase.prototype._appendQueryString = function() {console.trace("Unsupported");}

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function(reason, timeout, errno){
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function() {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function(){
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
}

},{"./is-object":11}],13:[function(require,module,exports){
'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function(field){
    return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function(header){
    // TODO: moar!
    // TODO: make this a util

    // content-type
    var ct = header['content-type'] || '';
    this.type = utils.type(ct);

    // params
    var params = utils.params(ct);
    for (var key in params) this[key] = params[key];

    this.links = {};

    // links
    try {
        if (header.link) {
            this.links = utils.parseLinks(header.link);
        }
    } catch (err) {
        // ignore
    }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = this.statusCode = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.redirect = 3 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = (4 == type || 5 == type)
        ? this.toError()
        : false;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.forbidden = 403 == status;
    this.notFound = 404 == status;
};

},{"./utils":15}],14:[function(require,module,exports){
'use strict';

var ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EADDRINFO',
  'ESOCKETTIMEDOUT'
];

/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */
module.exports = function shouldRetry(err, res) {
  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
  if (res && res.status && res.status >= 500) return true;
  // Superagent timeout
  if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
  if (err && 'crossDomain' in err) return true;
  return false;
};

},{}],15:[function(require,module,exports){
'use strict';

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function(str){
  return str.split(/ *, */).reduce(function(obj, str){
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function(header, shouldStripCookie){
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  if (shouldStripCookie) {
    delete header['cookie'];
  }
  return header;
};

},{}],16:[function(require,module,exports){
(function (Buffer){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent', 'querystring'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'), require('querystring'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.ApiClient = factory(root.superagent, root.querystring);
  }
}(this, function(superagent, querystring) {
  'use strict';

  /**
   * @module ApiClient
   * @version v1
   */

  /**
   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
   * application to use this class directly - the *Api and model classes provide the public API for the service. The
   * contents of this file should be regarded as internal but are documented for completeness.
   * @alias module:ApiClient
   * @class
   */
  var exports = function() {
    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://localhost
     */
    this.basePath = 'https://acman-server.conveyor.cloud/'.replace(/\/+$/, '');

    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */
    this.authentications = {
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */
    this.defaultHeaders = {};

    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */
    this.timeout = 60000;

    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */
    this.cache = true;

    /**
     * If set to true, the client will save the cookies from each server
     * response, and return them in the next request.
     * @default false
     */
    this.enableCookies = false;

    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */
    if (typeof window === 'undefined') {
      this.agent = new superagent.agent();
    }

    /*
     * Allow user to override superagent agent
     */
    this.requestAgent = null;
  };

  /**
   * Returns a string representation for an actual parameter.
   * @param param The actual parameter.
   * @returns {String} The string representation of <code>param</code>.
   */
  exports.prototype.paramToString = function(param) {
    if (param == undefined || param == null) {
      return '';
    }
    if (param instanceof Date) {
      return param.toJSON();
    }
    return param.toString();
  };

  /**
   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
   * NOTE: query parameters are not handled here.
   * @param {String} path The path to append to the base URL.
   * @param {Object} pathParams The parameter values to append.
   * @returns {String} The encoded path with parameter values substituted.
   */
  exports.prototype.buildUrl = function(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Checks whether the given content type represents JSON.<br>
   * JSON content type examples:<br>
   * <ul>
   * <li>application/json</li>
   * <li>application/json; charset=UTF8</li>
   * <li>APPLICATION/JSON</li>
   * </ul>
   * @param {String} contentType The MIME content type to check.
   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
   */
  exports.prototype.isJsonMime = function(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
   * @param {Array.<String>} contentTypes
   * @returns {String} The chosen content type, preferring JSON.
   */
  exports.prototype.jsonPreferredMime = function(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
      if (this.isJsonMime(contentTypes[i])) {
        return contentTypes[i];
      }
    }
    return contentTypes[0];
  };

  /**
   * Checks whether the given parameter value represents file-like content.
   * @param param The parameter to check.
   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
   */
  exports.prototype.isFileParam = function(param) {
    // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
    if (typeof require === 'function') {
      var fs;
      try {
        fs = require('fs');
      } catch (err) {}
      if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
        return true;
      }
    }
    // Buffer in Node.js
    if (typeof Buffer === 'function' && param instanceof Buffer) {
      return true;
    }
    // Blob in browser
    if (typeof Blob === 'function' && param instanceof Blob) {
      return true;
    }
    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
    if (typeof File === 'function' && param instanceof File) {
      return true;
    }
    return false;
  };

  /**
   * Normalizes parameter values:
   * <ul>
   * <li>remove nils</li>
   * <li>keep files and arrays</li>
   * <li>format to string with `paramToString` for other cases</li>
   * </ul>
   * @param {Object.<String, Object>} params The parameters as object properties.
   * @returns {Object.<String, Object>} normalized parameters.
   */
  exports.prototype.normalizeParams = function(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
        var value = params[key];
        if (this.isFileParam(value) || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  /**
   * Enumeration of collection format separator strategies.
   * @enum {String}
   * @readonly
   */
  exports.CollectionFormatEnum = {
    /**
     * Comma-separated values. Value: <code>csv</code>
     * @const
     */
    CSV: ',',
    /**
     * Space-separated values. Value: <code>ssv</code>
     * @const
     */
    SSV: ' ',
    /**
     * Tab-separated values. Value: <code>tsv</code>
     * @const
     */
    TSV: '\t',
    /**
     * Pipe(|)-separated values. Value: <code>pipes</code>
     * @const
     */
    PIPES: '|',
    /**
     * Native array. Value: <code>multi</code>
     * @const
     */
    MULTI: 'multi'
  };

  /**
   * Builds a string representation of an array-type actual parameter, according to the given collection format.
   * @param {Array} param An array parameter.
   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
   */
  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
      return null;
    }
    switch (collectionFormat) {
      case 'csv':
        return param.map(this.paramToString).join(',');
      case 'ssv':
        return param.map(this.paramToString).join(' ');
      case 'tsv':
        return param.map(this.paramToString).join('\t');
      case 'pipes':
        return param.map(this.paramToString).join('|');
      case 'multi':
        // return the array directly as SuperAgent will handle it as expected
        return param.map(this.paramToString);
      default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
  };

  /**
   * Applies authentication headers to the request.
   * @param {Object} request The request object created by a <code>superagent()</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  exports.prototype.applyAuthToRequest = function(request, authNames) {
    var _this = this;
    authNames.forEach(function(authName) {
      var auth = _this.authentications[authName];
      switch (auth.type) {
        case 'basic':
          if (auth.username || auth.password) {
            request.auth(auth.username || '', auth.password || '');
          }
          break;
        case 'apiKey':
          if (auth.apiKey) {
            var data = {};
            if (auth.apiKeyPrefix) {
              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
            } else {
              data[auth.name] = auth.apiKey;
            }
            if (auth['in'] === 'header') {
              request.set(data);
            } else {
              request.query(data);
            }
          }
          break;
        case 'oauth2':
          if (auth.accessToken) {
            request.set({'Authorization': 'Bearer ' + auth.accessToken});
          }
          break;
        default:
          throw new Error('Unknown authentication type: ' + auth.type);
      }
    });
  };

  /**
   * Deserializes an HTTP response body into a value of the specified type.
   * @param {Object} response A SuperAgent response object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns A value of the specified type.
   */
  exports.prototype.deserialize = function deserialize(response, returnType) {
    if (response == null || returnType == null || response.status == 204) {
      return null;
    }
    // Rely on SuperAgent for parsing response body.
    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
    var data = response.body;
    if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
      // SuperAgent does not always produce a body; use the unparsed response as a fallback
      data = response.text;
    }
    return exports.convertToType(data, returnType);
  };

  /**
   * Callback function to receive the result of the operation.
   * @callback module:ApiClient~callApiCallback
   * @param {String} error Error message, if any.
   * @param data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} collectionQueryParams A map of collection query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callApiCallback} callback The callback function.
   * @returns {Object} The SuperAgent request object.
   */
  exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, collectionQueryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
      returnType, callback) {

    var _this = this;
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // apply authentications
    this.applyAuthToRequest(request, authNames);

    // set collection query parameters
    for (var key in collectionQueryParams) {
      if (collectionQueryParams.hasOwnProperty(key)) {
        var param = collectionQueryParams[key];
        if (param.collectionFormat === 'csv') {
          // SuperAgent normally percent-encodes all reserved characters in a query parameter. However,
          // commas are used as delimiters for the 'csv' collectionFormat so they must not be encoded. We
          // must therefore construct and encode 'csv' collection query parameters manually.
          if (param.value != null) {
            var value = param.value.map(this.paramToString).map(encodeURIComponent).join(',');
            request.query(encodeURIComponent(key) + "=" + value);
          }
        } else {
          // All other collection query parameters should be treated as ordinary query parameters.
          queryParams[key] = this.buildCollectionParam(param.value, param.collectionFormat);
        }
      }
    }

    // set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
    }
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));


    // set requestAgent if it is set by user
    if (this.requestAgent) {
      request.agent(this.requestAgent);
    }

    // set request timeout
    request.timeout(this.timeout);

    var contentType = this.jsonPreferredMime(contentTypes);
    if (contentType) {
      // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
      if(contentType != 'multipart/form-data') {
        request.type(contentType);
      }
    } else if (!request.header['Content-Type']) {
      request.type('application/json');
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(querystring.stringify(this.normalizeParams(formParams)));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (this.isFileParam(_formParams[key])) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }

    if (returnType === 'Blob') {
      request.responseType('blob');
    } else if (returnType === 'String') {
      request.responseType('string');
    }

    // Attach previously saved cookies, if enabled
    if (this.enableCookies){
      if (typeof window === 'undefined') {
        this.agent.attachCookies(request);
      }
      else {
        request.withCredentials();
      }
    }


    request.end(function(error, response) {
      if (callback) {
        var data = null;
        if (!error) {
          try {
            data = _this.deserialize(response, returnType);
            if (_this.enableCookies && typeof window === 'undefined'){
              _this.agent.saveCookies(response);
            }
          } catch (err) {
            error = err;
          }
        }
        callback(error, data, response);
      }
    });

    return request;
  };

  /**
   * Parses an ISO-8601 string representation of a date value.
   * @param {String} str The date value as a string.
   * @returns {Date} The parsed date object.
   */
  exports.parseDate = function(str) {
    return new Date(str.replace(/T/i, ' '));
  };

  /**
   * Converts a value to the specified type.
   * @param {(String|Object)} data The data to convert, as a string or object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns An instance of the specified type or null or undefined if data is null or undefined.
   */
  exports.convertToType = function(data, type) {
    if (data === null || data === undefined)
      return data

    switch (type) {
      case 'Boolean':
        return Boolean(data);
      case 'Integer':
        return parseInt(data, 10);
      case 'Number':
        return parseFloat(data);
      case 'String':
        return String(data);
      case 'Date':
        return this.parseDate(String(data));
      case 'Blob':
      	return data;
      default:
        if (type === Object) {
          // generic object, return directly
          return data;
        } else if (typeof type === 'function') {
          // for model type like: User
          return type.constructFromObject(data);
        } else if (Array.isArray(type)) {
          // for array type like: ['String']
          var itemType = type[0];
          return data.map(function(item) {
            return exports.convertToType(item, itemType);
          });
        } else if (typeof type === 'object') {
          // for plain object type like: {'String': 'Integer'}
          var keyType, valueType;
          for (var k in type) {
            if (type.hasOwnProperty(k)) {
              keyType = k;
              valueType = type[k];
              break;
            }
          }
          var result = {};
          for (var k in data) {
            if (data.hasOwnProperty(k)) {
              var key = exports.convertToType(k, keyType);
              var value = exports.convertToType(data[k], valueType);
              result[key] = value;
            }
          }
          return result;
        } else {
          // for unknown type, return the data directly
          return data;
        }
    }
  };

  /**
   * Constructs a new map or array model from REST data.
   * @param data {Object|Array} The REST data.
   * @param obj {Object|Array} The target object or array.
   */
  exports.constructFromObject = function(data, obj, itemType) {
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data.hasOwnProperty(i))
          obj[i] = exports.convertToType(data[i], itemType);
      }
    } else {
      for (var k in data) {
        if (data.hasOwnProperty(k))
          obj[k] = exports.convertToType(data[k], itemType);
      }
    }
  };

  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  exports.instance = new exports();

  return exports;
}));

}).call(this,require("buffer").Buffer)
},{"buffer":3,"fs":1,"querystring":7,"superagent":10}],17:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Account'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Account'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.AccountApi = factory(root.MyApi.ApiClient, root.MyApi.Account);
  }
}(this, function(ApiClient, Account) {
  'use strict';

  /**
   * Account service.
   * @module api/AccountApi
   * @version v1
   */

  /**
   * Constructs a new AccountApi. 
   * @alias module:api/AccountApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiAccountAddPost operation.
     * @callback module:api/AccountApi~apiAccountAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Account} opts.entity 
     * @param {module:api/AccountApi~apiAccountAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiAccountAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Account/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiAccountEditPut operation.
     * @callback module:api/AccountApi~apiAccountEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Account} opts.entity 
     * @param {module:api/AccountApi~apiAccountEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiAccountEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Account/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiAccountGetByIdGet operation.
     * @callback module:api/AccountApi~apiAccountGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Account} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/AccountApi~apiAccountGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Account}
     */
    this.apiAccountGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiAccountGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Account;

      return this.apiClient.callApi(
        '/api/Account/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiAccountGetGet operation.
     * @callback module:api/AccountApi~apiAccountGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Account>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/AccountApi~apiAccountGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Account>}
     */
    this.apiAccountGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Account];

      return this.apiClient.callApi(
        '/api/Account/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiAccountRemoveByIdDelete operation.
     * @callback module:api/AccountApi~apiAccountRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/AccountApi~apiAccountRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiAccountRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiAccountRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Account/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiAccountRemoveDelete operation.
     * @callback module:api/AccountApi~apiAccountRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Account} opts.entity 
     * @param {module:api/AccountApi~apiAccountRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiAccountRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Account/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Account":29}],18:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Activity'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.ActivityApi = factory(root.MyApi.ApiClient, root.MyApi.Activity);
  }
}(this, function(ApiClient, Activity) {
  'use strict';

  /**
   * Activity service.
   * @module api/ActivityApi
   * @version v1
   */

  /**
   * Constructs a new ActivityApi. 
   * @alias module:api/ActivityApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiActivityAddPost operation.
     * @callback module:api/ActivityApi~apiActivityAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/ActivityApi~apiActivityAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiActivityAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Activity/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityContinueByIdPost operation.
     * @callback module:api/ActivityApi~apiActivityContinueByIdPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {String} opts.id 
     * @param {module:api/ActivityApi~apiActivityContinueByIdPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiActivityContinueByIdPost = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'id': opts['id'],
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/Activity/ContinueById', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityContinuePost operation.
     * @callback module:api/ActivityApi~apiActivityContinuePostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.activity 
     * @param {module:api/ActivityApi~apiActivityContinuePostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiActivityContinuePost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['activity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/Activity/Continue', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityCreatePost operation.
     * @callback module:api/ActivityApi~apiActivityCreatePostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.activity 
     * @param {module:api/ActivityApi~apiActivityCreatePostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiActivityCreatePost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['activity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Activity/Create', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityEditPut operation.
     * @callback module:api/ActivityApi~apiActivityEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/ActivityApi~apiActivityEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiActivityEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Activity/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityGetByIdGet operation.
     * @callback module:api/ActivityApi~apiActivityGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/ActivityApi~apiActivityGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiActivityGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiActivityGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/Activity/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityGetByPeriodGet operation.
     * @callback module:api/ActivityApi~apiActivityGetByPeriodGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {Date} opts.startDate 
     * @param {Date} opts.endDate 
     * @param {module:api/ActivityApi~apiActivityGetByPeriodGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiActivityGetByPeriodGet = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'startDate': opts['startDate'],
        'endDate': opts['endDate'],
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/Activity/GetByPeriod', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityGetGet operation.
     * @callback module:api/ActivityApi~apiActivityGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/ActivityApi~apiActivityGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiActivityGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/Activity/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityGetOnPauseGet operation.
     * @callback module:api/ActivityApi~apiActivityGetOnPauseGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/ActivityApi~apiActivityGetOnPauseGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiActivityGetOnPauseGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/Activity/GetOnPause', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityRemoveByIdDelete operation.
     * @callback module:api/ActivityApi~apiActivityRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/ActivityApi~apiActivityRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiActivityRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiActivityRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Activity/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityRemoveDelete operation.
     * @callback module:api/ActivityApi~apiActivityRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/ActivityApi~apiActivityRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiActivityRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Activity/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityStartPost operation.
     * @callback module:api/ActivityApi~apiActivityStartPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {String} opts.caption 
     * @param {String} opts.userId 
     * @param {String} opts.userLogin 
     * @param {String} opts.userPassword 
     * @param {Array.<Object>} opts.userUserInSystems 
     * @param {Array.<Object>} opts.userActivities 
     * @param {Date} opts.userLastSyncDate 
     * @param {String} opts.userEndSystemRecordId 
     * @param {Boolean} opts.userIsSynchronized 
     * @param {Boolean} opts.userIsIntegration 
     * @param {Boolean} opts.userNeedUpdateRemoteIds 
     * @param {String} opts.userName 
     * @param {String} opts.userId2 
     * @param {Date} opts.userCreatedOn 
     * @param {String} opts.userCreatedById 
     * @param {String} opts.userCreatedByLogin 
     * @param {String} opts.userCreatedByPassword 
     * @param {Array.<Object>} opts.userCreatedByUserInSystems 
     * @param {Array.<Object>} opts.userCreatedByActivities 
     * @param {Date} opts.userCreatedByLastSyncDate 
     * @param {String} opts.userCreatedByEndSystemRecordId 
     * @param {Boolean} opts.userCreatedByIsSynchronized 
     * @param {Boolean} opts.userCreatedByIsIntegration 
     * @param {Boolean} opts.userCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.userCreatedByName 
     * @param {String} opts.userCreatedById2 
     * @param {Date} opts.userCreatedByCreatedOn 
     * @param {String} opts.userCreatedByCreatedById 
     * @param {Object} opts.userCreatedByCreatedBy 
     * @param {Date} opts.userCreatedByModifiedOn 
     * @param {String} opts.userCreatedByModifiedById 
     * @param {String} opts.userCreatedByModifiedByLogin 
     * @param {String} opts.userCreatedByModifiedByPassword 
     * @param {Array.<Object>} opts.userCreatedByModifiedByUserInSystems 
     * @param {Array.<Object>} opts.userCreatedByModifiedByActivities 
     * @param {Date} opts.userCreatedByModifiedByLastSyncDate 
     * @param {String} opts.userCreatedByModifiedByEndSystemRecordId 
     * @param {Boolean} opts.userCreatedByModifiedByIsSynchronized 
     * @param {Boolean} opts.userCreatedByModifiedByIsIntegration 
     * @param {Boolean} opts.userCreatedByModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.userCreatedByModifiedByName 
     * @param {String} opts.userCreatedByModifiedById2 
     * @param {Date} opts.userCreatedByModifiedByCreatedOn 
     * @param {String} opts.userCreatedByModifiedByCreatedById 
     * @param {Object} opts.userCreatedByModifiedByCreatedBy 
     * @param {Date} opts.userCreatedByModifiedByModifiedOn 
     * @param {String} opts.userCreatedByModifiedByModifiedById 
     * @param {Object} opts.userCreatedByModifiedByModifiedBy 
     * @param {module:model/Number} opts.userCreatedByModifiedByEntityState 
     * @param {module:model/Number} opts.userCreatedByEntityState 
     * @param {Date} opts.userModifiedOn 
     * @param {String} opts.userModifiedById 
     * @param {Object} opts.userModifiedBy 
     * @param {module:model/Number} opts.userEntityState 
     * @param {Date} opts.start 
     * @param {Date} opts.end 
     * @param {module:model/Number} opts.status 
     * @param {Array.<Object>} opts.tags 
     * @param {Array.<Object>} opts.tagInActivities 
     * @param {String} opts.endSystemRecordId 
     * @param {Boolean} opts.isSynchronized 
     * @param {Boolean} opts.isIntegration 
     * @param {Boolean} opts.needUpdateRemoteIds 
     * @param {String} opts.jiraUrl 
     * @param {String} opts.accountId 
     * @param {String} opts.accountEndSystemRecordId 
     * @param {Boolean} opts.accountIsSynchronized 
     * @param {Boolean} opts.accountIsIntegration 
     * @param {Boolean} opts.accountNeedUpdateRemoteIds 
     * @param {String} opts.accountName 
     * @param {String} opts.accountId2 
     * @param {Date} opts.accountCreatedOn 
     * @param {String} opts.accountCreatedById 
     * @param {String} opts.accountCreatedByLogin 
     * @param {String} opts.accountCreatedByPassword 
     * @param {Array.<Object>} opts.accountCreatedByUserInSystems 
     * @param {Array.<Object>} opts.accountCreatedByActivities 
     * @param {Date} opts.accountCreatedByLastSyncDate 
     * @param {String} opts.accountCreatedByEndSystemRecordId 
     * @param {Boolean} opts.accountCreatedByIsSynchronized 
     * @param {Boolean} opts.accountCreatedByIsIntegration 
     * @param {Boolean} opts.accountCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.accountCreatedByName 
     * @param {String} opts.accountCreatedById2 
     * @param {Date} opts.accountCreatedByCreatedOn 
     * @param {String} opts.accountCreatedByCreatedById 
     * @param {Object} opts.accountCreatedByCreatedBy 
     * @param {Date} opts.accountCreatedByModifiedOn 
     * @param {String} opts.accountCreatedByModifiedById 
     * @param {Object} opts.accountCreatedByModifiedBy 
     * @param {module:model/Number} opts.accountCreatedByEntityState 
     * @param {Date} opts.accountModifiedOn 
     * @param {String} opts.accountModifiedById 
     * @param {String} opts.accountModifiedByLogin 
     * @param {String} opts.accountModifiedByPassword 
     * @param {Array.<Object>} opts.accountModifiedByUserInSystems 
     * @param {Array.<Object>} opts.accountModifiedByActivities 
     * @param {Date} opts.accountModifiedByLastSyncDate 
     * @param {String} opts.accountModifiedByEndSystemRecordId 
     * @param {Boolean} opts.accountModifiedByIsSynchronized 
     * @param {Boolean} opts.accountModifiedByIsIntegration 
     * @param {Boolean} opts.accountModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.accountModifiedByName 
     * @param {String} opts.accountModifiedById2 
     * @param {Date} opts.accountModifiedByCreatedOn 
     * @param {String} opts.accountModifiedByCreatedById 
     * @param {Object} opts.accountModifiedByCreatedBy 
     * @param {Date} opts.accountModifiedByModifiedOn 
     * @param {String} opts.accountModifiedByModifiedById 
     * @param {Object} opts.accountModifiedByModifiedBy 
     * @param {module:model/Number} opts.accountModifiedByEntityState 
     * @param {module:model/Number} opts.accountEntityState 
     * @param {String} opts.projectId 
     * @param {String} opts.projectEndSystemRecordId 
     * @param {Boolean} opts.projectIsSynchronized 
     * @param {Boolean} opts.projectIsIntegration 
     * @param {Boolean} opts.projectNeedUpdateRemoteIds 
     * @param {String} opts.projectName 
     * @param {String} opts.projectId2 
     * @param {Date} opts.projectCreatedOn 
     * @param {String} opts.projectCreatedById 
     * @param {String} opts.projectCreatedByLogin 
     * @param {String} opts.projectCreatedByPassword 
     * @param {Array.<Object>} opts.projectCreatedByUserInSystems 
     * @param {Array.<Object>} opts.projectCreatedByActivities 
     * @param {Date} opts.projectCreatedByLastSyncDate 
     * @param {String} opts.projectCreatedByEndSystemRecordId 
     * @param {Boolean} opts.projectCreatedByIsSynchronized 
     * @param {Boolean} opts.projectCreatedByIsIntegration 
     * @param {Boolean} opts.projectCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.projectCreatedByName 
     * @param {String} opts.projectCreatedById2 
     * @param {Date} opts.projectCreatedByCreatedOn 
     * @param {String} opts.projectCreatedByCreatedById 
     * @param {Object} opts.projectCreatedByCreatedBy 
     * @param {Date} opts.projectCreatedByModifiedOn 
     * @param {String} opts.projectCreatedByModifiedById 
     * @param {Object} opts.projectCreatedByModifiedBy 
     * @param {module:model/Number} opts.projectCreatedByEntityState 
     * @param {Date} opts.projectModifiedOn 
     * @param {String} opts.projectModifiedById 
     * @param {String} opts.projectModifiedByLogin 
     * @param {String} opts.projectModifiedByPassword 
     * @param {Array.<Object>} opts.projectModifiedByUserInSystems 
     * @param {Array.<Object>} opts.projectModifiedByActivities 
     * @param {Date} opts.projectModifiedByLastSyncDate 
     * @param {String} opts.projectModifiedByEndSystemRecordId 
     * @param {Boolean} opts.projectModifiedByIsSynchronized 
     * @param {Boolean} opts.projectModifiedByIsIntegration 
     * @param {Boolean} opts.projectModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.projectModifiedByName 
     * @param {String} opts.projectModifiedById2 
     * @param {Date} opts.projectModifiedByCreatedOn 
     * @param {String} opts.projectModifiedByCreatedById 
     * @param {Object} opts.projectModifiedByCreatedBy 
     * @param {Date} opts.projectModifiedByModifiedOn 
     * @param {String} opts.projectModifiedByModifiedById 
     * @param {Object} opts.projectModifiedByModifiedBy 
     * @param {module:model/Number} opts.projectModifiedByEntityState 
     * @param {module:model/Number} opts.projectEntityState 
     * @param {String} opts.workInProjectId 
     * @param {String} opts.workInProjectProjectId 
     * @param {String} opts.workInProjectProjectEndSystemRecordId 
     * @param {Boolean} opts.workInProjectProjectIsSynchronized 
     * @param {Boolean} opts.workInProjectProjectIsIntegration 
     * @param {Boolean} opts.workInProjectProjectNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectProjectName 
     * @param {String} opts.workInProjectProjectId2 
     * @param {Date} opts.workInProjectProjectCreatedOn 
     * @param {String} opts.workInProjectProjectCreatedById 
     * @param {Object} opts.workInProjectProjectCreatedBy 
     * @param {Date} opts.workInProjectProjectModifiedOn 
     * @param {String} opts.workInProjectProjectModifiedById 
     * @param {Object} opts.workInProjectProjectModifiedBy 
     * @param {module:model/Number} opts.workInProjectProjectEntityState 
     * @param {String} opts.workInProjectEndSystemRecordId 
     * @param {Boolean} opts.workInProjectIsSynchronized 
     * @param {Boolean} opts.workInProjectIsIntegration 
     * @param {Boolean} opts.workInProjectNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectName 
     * @param {String} opts.workInProjectId2 
     * @param {Date} opts.workInProjectCreatedOn 
     * @param {String} opts.workInProjectCreatedById 
     * @param {String} opts.workInProjectCreatedByLogin 
     * @param {String} opts.workInProjectCreatedByPassword 
     * @param {Array.<Object>} opts.workInProjectCreatedByUserInSystems 
     * @param {Array.<Object>} opts.workInProjectCreatedByActivities 
     * @param {Date} opts.workInProjectCreatedByLastSyncDate 
     * @param {String} opts.workInProjectCreatedByEndSystemRecordId 
     * @param {Boolean} opts.workInProjectCreatedByIsSynchronized 
     * @param {Boolean} opts.workInProjectCreatedByIsIntegration 
     * @param {Boolean} opts.workInProjectCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectCreatedByName 
     * @param {String} opts.workInProjectCreatedById2 
     * @param {Date} opts.workInProjectCreatedByCreatedOn 
     * @param {String} opts.workInProjectCreatedByCreatedById 
     * @param {Object} opts.workInProjectCreatedByCreatedBy 
     * @param {Date} opts.workInProjectCreatedByModifiedOn 
     * @param {String} opts.workInProjectCreatedByModifiedById 
     * @param {Object} opts.workInProjectCreatedByModifiedBy 
     * @param {module:model/Number} opts.workInProjectCreatedByEntityState 
     * @param {Date} opts.workInProjectModifiedOn 
     * @param {String} opts.workInProjectModifiedById 
     * @param {String} opts.workInProjectModifiedByLogin 
     * @param {String} opts.workInProjectModifiedByPassword 
     * @param {Array.<Object>} opts.workInProjectModifiedByUserInSystems 
     * @param {Array.<Object>} opts.workInProjectModifiedByActivities 
     * @param {Date} opts.workInProjectModifiedByLastSyncDate 
     * @param {String} opts.workInProjectModifiedByEndSystemRecordId 
     * @param {Boolean} opts.workInProjectModifiedByIsSynchronized 
     * @param {Boolean} opts.workInProjectModifiedByIsIntegration 
     * @param {Boolean} opts.workInProjectModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectModifiedByName 
     * @param {String} opts.workInProjectModifiedById2 
     * @param {Date} opts.workInProjectModifiedByCreatedOn 
     * @param {String} opts.workInProjectModifiedByCreatedById 
     * @param {Object} opts.workInProjectModifiedByCreatedBy 
     * @param {Date} opts.workInProjectModifiedByModifiedOn 
     * @param {String} opts.workInProjectModifiedByModifiedById 
     * @param {Object} opts.workInProjectModifiedByModifiedBy 
     * @param {module:model/Number} opts.workInProjectModifiedByEntityState 
     * @param {module:model/Number} opts.workInProjectEntityState 
     * @param {String} opts.id 
     * @param {Date} opts.createdOn 
     * @param {String} opts.createdById 
     * @param {String} opts.createdByLogin 
     * @param {String} opts.createdByPassword 
     * @param {Array.<Object>} opts.createdByUserInSystems 
     * @param {Array.<Object>} opts.createdByActivities 
     * @param {Date} opts.createdByLastSyncDate 
     * @param {String} opts.createdByEndSystemRecordId 
     * @param {Boolean} opts.createdByIsSynchronized 
     * @param {Boolean} opts.createdByIsIntegration 
     * @param {Boolean} opts.createdByNeedUpdateRemoteIds 
     * @param {String} opts.createdByName 
     * @param {String} opts.createdById2 
     * @param {Date} opts.createdByCreatedOn 
     * @param {String} opts.createdByCreatedById 
     * @param {Object} opts.createdByCreatedBy 
     * @param {Date} opts.createdByModifiedOn 
     * @param {String} opts.createdByModifiedById 
     * @param {Object} opts.createdByModifiedBy 
     * @param {module:model/Number} opts.createdByEntityState 
     * @param {Date} opts.modifiedOn 
     * @param {String} opts.modifiedById 
     * @param {String} opts.modifiedByLogin 
     * @param {String} opts.modifiedByPassword 
     * @param {Array.<Object>} opts.modifiedByUserInSystems 
     * @param {Array.<Object>} opts.modifiedByActivities 
     * @param {Date} opts.modifiedByLastSyncDate 
     * @param {String} opts.modifiedByEndSystemRecordId 
     * @param {Boolean} opts.modifiedByIsSynchronized 
     * @param {Boolean} opts.modifiedByIsIntegration 
     * @param {Boolean} opts.modifiedByNeedUpdateRemoteIds 
     * @param {String} opts.modifiedByName 
     * @param {String} opts.modifiedById2 
     * @param {Date} opts.modifiedByCreatedOn 
     * @param {String} opts.modifiedByCreatedById 
     * @param {Object} opts.modifiedByCreatedBy 
     * @param {Date} opts.modifiedByModifiedOn 
     * @param {String} opts.modifiedByModifiedById 
     * @param {Object} opts.modifiedByModifiedBy 
     * @param {module:model/Number} opts.modifiedByEntityState 
     * @param {module:model/Number} opts.entityState 
     * @param {module:api/ActivityApi~apiActivityStartPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiActivityStartPost = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'Caption': opts['caption'],
        'UserId': opts['userId'],
        'User.Login': opts['userLogin'],
        'User.Password': opts['userPassword'],
        'User.LastSyncDate': opts['userLastSyncDate'],
        'User.EndSystemRecordId': opts['userEndSystemRecordId'],
        'User.IsSynchronized': opts['userIsSynchronized'],
        'User.IsIntegration': opts['userIsIntegration'],
        'User.NeedUpdateRemoteIds': opts['userNeedUpdateRemoteIds'],
        'User.Name': opts['userName'],
        'User.Id': opts['userId2'],
        'User.CreatedOn': opts['userCreatedOn'],
        'User.CreatedById': opts['userCreatedById'],
        'User.CreatedBy.Login': opts['userCreatedByLogin'],
        'User.CreatedBy.Password': opts['userCreatedByPassword'],
        'User.CreatedBy.LastSyncDate': opts['userCreatedByLastSyncDate'],
        'User.CreatedBy.EndSystemRecordId': opts['userCreatedByEndSystemRecordId'],
        'User.CreatedBy.IsSynchronized': opts['userCreatedByIsSynchronized'],
        'User.CreatedBy.IsIntegration': opts['userCreatedByIsIntegration'],
        'User.CreatedBy.NeedUpdateRemoteIds': opts['userCreatedByNeedUpdateRemoteIds'],
        'User.CreatedBy.Name': opts['userCreatedByName'],
        'User.CreatedBy.Id': opts['userCreatedById2'],
        'User.CreatedBy.CreatedOn': opts['userCreatedByCreatedOn'],
        'User.CreatedBy.CreatedById': opts['userCreatedByCreatedById'],
        'User.CreatedBy.CreatedBy': opts['userCreatedByCreatedBy'],
        'User.CreatedBy.ModifiedOn': opts['userCreatedByModifiedOn'],
        'User.CreatedBy.ModifiedById': opts['userCreatedByModifiedById'],
        'User.CreatedBy.ModifiedBy.Login': opts['userCreatedByModifiedByLogin'],
        'User.CreatedBy.ModifiedBy.Password': opts['userCreatedByModifiedByPassword'],
        'User.CreatedBy.ModifiedBy.LastSyncDate': opts['userCreatedByModifiedByLastSyncDate'],
        'User.CreatedBy.ModifiedBy.EndSystemRecordId': opts['userCreatedByModifiedByEndSystemRecordId'],
        'User.CreatedBy.ModifiedBy.IsSynchronized': opts['userCreatedByModifiedByIsSynchronized'],
        'User.CreatedBy.ModifiedBy.IsIntegration': opts['userCreatedByModifiedByIsIntegration'],
        'User.CreatedBy.ModifiedBy.NeedUpdateRemoteIds': opts['userCreatedByModifiedByNeedUpdateRemoteIds'],
        'User.CreatedBy.ModifiedBy.Name': opts['userCreatedByModifiedByName'],
        'User.CreatedBy.ModifiedBy.Id': opts['userCreatedByModifiedById2'],
        'User.CreatedBy.ModifiedBy.CreatedOn': opts['userCreatedByModifiedByCreatedOn'],
        'User.CreatedBy.ModifiedBy.CreatedById': opts['userCreatedByModifiedByCreatedById'],
        'User.CreatedBy.ModifiedBy.CreatedBy': opts['userCreatedByModifiedByCreatedBy'],
        'User.CreatedBy.ModifiedBy.ModifiedOn': opts['userCreatedByModifiedByModifiedOn'],
        'User.CreatedBy.ModifiedBy.ModifiedById': opts['userCreatedByModifiedByModifiedById'],
        'User.CreatedBy.ModifiedBy.ModifiedBy': opts['userCreatedByModifiedByModifiedBy'],
        'User.CreatedBy.ModifiedBy.EntityState': opts['userCreatedByModifiedByEntityState'],
        'User.CreatedBy.EntityState': opts['userCreatedByEntityState'],
        'User.ModifiedOn': opts['userModifiedOn'],
        'User.ModifiedById': opts['userModifiedById'],
        'User.ModifiedBy': opts['userModifiedBy'],
        'User.EntityState': opts['userEntityState'],
        'Start': opts['start'],
        'End': opts['end'],
        'Status': opts['status'],
        'EndSystemRecordId': opts['endSystemRecordId'],
        'IsSynchronized': opts['isSynchronized'],
        'IsIntegration': opts['isIntegration'],
        'NeedUpdateRemoteIds': opts['needUpdateRemoteIds'],
        'JiraUrl': opts['jiraUrl'],
        'AccountId': opts['accountId'],
        'Account.EndSystemRecordId': opts['accountEndSystemRecordId'],
        'Account.IsSynchronized': opts['accountIsSynchronized'],
        'Account.IsIntegration': opts['accountIsIntegration'],
        'Account.NeedUpdateRemoteIds': opts['accountNeedUpdateRemoteIds'],
        'Account.Name': opts['accountName'],
        'Account.Id': opts['accountId2'],
        'Account.CreatedOn': opts['accountCreatedOn'],
        'Account.CreatedById': opts['accountCreatedById'],
        'Account.CreatedBy.Login': opts['accountCreatedByLogin'],
        'Account.CreatedBy.Password': opts['accountCreatedByPassword'],
        'Account.CreatedBy.LastSyncDate': opts['accountCreatedByLastSyncDate'],
        'Account.CreatedBy.EndSystemRecordId': opts['accountCreatedByEndSystemRecordId'],
        'Account.CreatedBy.IsSynchronized': opts['accountCreatedByIsSynchronized'],
        'Account.CreatedBy.IsIntegration': opts['accountCreatedByIsIntegration'],
        'Account.CreatedBy.NeedUpdateRemoteIds': opts['accountCreatedByNeedUpdateRemoteIds'],
        'Account.CreatedBy.Name': opts['accountCreatedByName'],
        'Account.CreatedBy.Id': opts['accountCreatedById2'],
        'Account.CreatedBy.CreatedOn': opts['accountCreatedByCreatedOn'],
        'Account.CreatedBy.CreatedById': opts['accountCreatedByCreatedById'],
        'Account.CreatedBy.CreatedBy': opts['accountCreatedByCreatedBy'],
        'Account.CreatedBy.ModifiedOn': opts['accountCreatedByModifiedOn'],
        'Account.CreatedBy.ModifiedById': opts['accountCreatedByModifiedById'],
        'Account.CreatedBy.ModifiedBy': opts['accountCreatedByModifiedBy'],
        'Account.CreatedBy.EntityState': opts['accountCreatedByEntityState'],
        'Account.ModifiedOn': opts['accountModifiedOn'],
        'Account.ModifiedById': opts['accountModifiedById'],
        'Account.ModifiedBy.Login': opts['accountModifiedByLogin'],
        'Account.ModifiedBy.Password': opts['accountModifiedByPassword'],
        'Account.ModifiedBy.LastSyncDate': opts['accountModifiedByLastSyncDate'],
        'Account.ModifiedBy.EndSystemRecordId': opts['accountModifiedByEndSystemRecordId'],
        'Account.ModifiedBy.IsSynchronized': opts['accountModifiedByIsSynchronized'],
        'Account.ModifiedBy.IsIntegration': opts['accountModifiedByIsIntegration'],
        'Account.ModifiedBy.NeedUpdateRemoteIds': opts['accountModifiedByNeedUpdateRemoteIds'],
        'Account.ModifiedBy.Name': opts['accountModifiedByName'],
        'Account.ModifiedBy.Id': opts['accountModifiedById2'],
        'Account.ModifiedBy.CreatedOn': opts['accountModifiedByCreatedOn'],
        'Account.ModifiedBy.CreatedById': opts['accountModifiedByCreatedById'],
        'Account.ModifiedBy.CreatedBy': opts['accountModifiedByCreatedBy'],
        'Account.ModifiedBy.ModifiedOn': opts['accountModifiedByModifiedOn'],
        'Account.ModifiedBy.ModifiedById': opts['accountModifiedByModifiedById'],
        'Account.ModifiedBy.ModifiedBy': opts['accountModifiedByModifiedBy'],
        'Account.ModifiedBy.EntityState': opts['accountModifiedByEntityState'],
        'Account.EntityState': opts['accountEntityState'],
        'ProjectId': opts['projectId'],
        'Project.EndSystemRecordId': opts['projectEndSystemRecordId'],
        'Project.IsSynchronized': opts['projectIsSynchronized'],
        'Project.IsIntegration': opts['projectIsIntegration'],
        'Project.NeedUpdateRemoteIds': opts['projectNeedUpdateRemoteIds'],
        'Project.Name': opts['projectName'],
        'Project.Id': opts['projectId2'],
        'Project.CreatedOn': opts['projectCreatedOn'],
        'Project.CreatedById': opts['projectCreatedById'],
        'Project.CreatedBy.Login': opts['projectCreatedByLogin'],
        'Project.CreatedBy.Password': opts['projectCreatedByPassword'],
        'Project.CreatedBy.LastSyncDate': opts['projectCreatedByLastSyncDate'],
        'Project.CreatedBy.EndSystemRecordId': opts['projectCreatedByEndSystemRecordId'],
        'Project.CreatedBy.IsSynchronized': opts['projectCreatedByIsSynchronized'],
        'Project.CreatedBy.IsIntegration': opts['projectCreatedByIsIntegration'],
        'Project.CreatedBy.NeedUpdateRemoteIds': opts['projectCreatedByNeedUpdateRemoteIds'],
        'Project.CreatedBy.Name': opts['projectCreatedByName'],
        'Project.CreatedBy.Id': opts['projectCreatedById2'],
        'Project.CreatedBy.CreatedOn': opts['projectCreatedByCreatedOn'],
        'Project.CreatedBy.CreatedById': opts['projectCreatedByCreatedById'],
        'Project.CreatedBy.CreatedBy': opts['projectCreatedByCreatedBy'],
        'Project.CreatedBy.ModifiedOn': opts['projectCreatedByModifiedOn'],
        'Project.CreatedBy.ModifiedById': opts['projectCreatedByModifiedById'],
        'Project.CreatedBy.ModifiedBy': opts['projectCreatedByModifiedBy'],
        'Project.CreatedBy.EntityState': opts['projectCreatedByEntityState'],
        'Project.ModifiedOn': opts['projectModifiedOn'],
        'Project.ModifiedById': opts['projectModifiedById'],
        'Project.ModifiedBy.Login': opts['projectModifiedByLogin'],
        'Project.ModifiedBy.Password': opts['projectModifiedByPassword'],
        'Project.ModifiedBy.LastSyncDate': opts['projectModifiedByLastSyncDate'],
        'Project.ModifiedBy.EndSystemRecordId': opts['projectModifiedByEndSystemRecordId'],
        'Project.ModifiedBy.IsSynchronized': opts['projectModifiedByIsSynchronized'],
        'Project.ModifiedBy.IsIntegration': opts['projectModifiedByIsIntegration'],
        'Project.ModifiedBy.NeedUpdateRemoteIds': opts['projectModifiedByNeedUpdateRemoteIds'],
        'Project.ModifiedBy.Name': opts['projectModifiedByName'],
        'Project.ModifiedBy.Id': opts['projectModifiedById2'],
        'Project.ModifiedBy.CreatedOn': opts['projectModifiedByCreatedOn'],
        'Project.ModifiedBy.CreatedById': opts['projectModifiedByCreatedById'],
        'Project.ModifiedBy.CreatedBy': opts['projectModifiedByCreatedBy'],
        'Project.ModifiedBy.ModifiedOn': opts['projectModifiedByModifiedOn'],
        'Project.ModifiedBy.ModifiedById': opts['projectModifiedByModifiedById'],
        'Project.ModifiedBy.ModifiedBy': opts['projectModifiedByModifiedBy'],
        'Project.ModifiedBy.EntityState': opts['projectModifiedByEntityState'],
        'Project.EntityState': opts['projectEntityState'],
        'WorkInProjectId': opts['workInProjectId'],
        'WorkInProject.ProjectId': opts['workInProjectProjectId'],
        'WorkInProject.Project.EndSystemRecordId': opts['workInProjectProjectEndSystemRecordId'],
        'WorkInProject.Project.IsSynchronized': opts['workInProjectProjectIsSynchronized'],
        'WorkInProject.Project.IsIntegration': opts['workInProjectProjectIsIntegration'],
        'WorkInProject.Project.NeedUpdateRemoteIds': opts['workInProjectProjectNeedUpdateRemoteIds'],
        'WorkInProject.Project.Name': opts['workInProjectProjectName'],
        'WorkInProject.Project.Id': opts['workInProjectProjectId2'],
        'WorkInProject.Project.CreatedOn': opts['workInProjectProjectCreatedOn'],
        'WorkInProject.Project.CreatedById': opts['workInProjectProjectCreatedById'],
        'WorkInProject.Project.CreatedBy': opts['workInProjectProjectCreatedBy'],
        'WorkInProject.Project.ModifiedOn': opts['workInProjectProjectModifiedOn'],
        'WorkInProject.Project.ModifiedById': opts['workInProjectProjectModifiedById'],
        'WorkInProject.Project.ModifiedBy': opts['workInProjectProjectModifiedBy'],
        'WorkInProject.Project.EntityState': opts['workInProjectProjectEntityState'],
        'WorkInProject.EndSystemRecordId': opts['workInProjectEndSystemRecordId'],
        'WorkInProject.IsSynchronized': opts['workInProjectIsSynchronized'],
        'WorkInProject.IsIntegration': opts['workInProjectIsIntegration'],
        'WorkInProject.NeedUpdateRemoteIds': opts['workInProjectNeedUpdateRemoteIds'],
        'WorkInProject.Name': opts['workInProjectName'],
        'WorkInProject.Id': opts['workInProjectId2'],
        'WorkInProject.CreatedOn': opts['workInProjectCreatedOn'],
        'WorkInProject.CreatedById': opts['workInProjectCreatedById'],
        'WorkInProject.CreatedBy.Login': opts['workInProjectCreatedByLogin'],
        'WorkInProject.CreatedBy.Password': opts['workInProjectCreatedByPassword'],
        'WorkInProject.CreatedBy.LastSyncDate': opts['workInProjectCreatedByLastSyncDate'],
        'WorkInProject.CreatedBy.EndSystemRecordId': opts['workInProjectCreatedByEndSystemRecordId'],
        'WorkInProject.CreatedBy.IsSynchronized': opts['workInProjectCreatedByIsSynchronized'],
        'WorkInProject.CreatedBy.IsIntegration': opts['workInProjectCreatedByIsIntegration'],
        'WorkInProject.CreatedBy.NeedUpdateRemoteIds': opts['workInProjectCreatedByNeedUpdateRemoteIds'],
        'WorkInProject.CreatedBy.Name': opts['workInProjectCreatedByName'],
        'WorkInProject.CreatedBy.Id': opts['workInProjectCreatedById2'],
        'WorkInProject.CreatedBy.CreatedOn': opts['workInProjectCreatedByCreatedOn'],
        'WorkInProject.CreatedBy.CreatedById': opts['workInProjectCreatedByCreatedById'],
        'WorkInProject.CreatedBy.CreatedBy': opts['workInProjectCreatedByCreatedBy'],
        'WorkInProject.CreatedBy.ModifiedOn': opts['workInProjectCreatedByModifiedOn'],
        'WorkInProject.CreatedBy.ModifiedById': opts['workInProjectCreatedByModifiedById'],
        'WorkInProject.CreatedBy.ModifiedBy': opts['workInProjectCreatedByModifiedBy'],
        'WorkInProject.CreatedBy.EntityState': opts['workInProjectCreatedByEntityState'],
        'WorkInProject.ModifiedOn': opts['workInProjectModifiedOn'],
        'WorkInProject.ModifiedById': opts['workInProjectModifiedById'],
        'WorkInProject.ModifiedBy.Login': opts['workInProjectModifiedByLogin'],
        'WorkInProject.ModifiedBy.Password': opts['workInProjectModifiedByPassword'],
        'WorkInProject.ModifiedBy.LastSyncDate': opts['workInProjectModifiedByLastSyncDate'],
        'WorkInProject.ModifiedBy.EndSystemRecordId': opts['workInProjectModifiedByEndSystemRecordId'],
        'WorkInProject.ModifiedBy.IsSynchronized': opts['workInProjectModifiedByIsSynchronized'],
        'WorkInProject.ModifiedBy.IsIntegration': opts['workInProjectModifiedByIsIntegration'],
        'WorkInProject.ModifiedBy.NeedUpdateRemoteIds': opts['workInProjectModifiedByNeedUpdateRemoteIds'],
        'WorkInProject.ModifiedBy.Name': opts['workInProjectModifiedByName'],
        'WorkInProject.ModifiedBy.Id': opts['workInProjectModifiedById2'],
        'WorkInProject.ModifiedBy.CreatedOn': opts['workInProjectModifiedByCreatedOn'],
        'WorkInProject.ModifiedBy.CreatedById': opts['workInProjectModifiedByCreatedById'],
        'WorkInProject.ModifiedBy.CreatedBy': opts['workInProjectModifiedByCreatedBy'],
        'WorkInProject.ModifiedBy.ModifiedOn': opts['workInProjectModifiedByModifiedOn'],
        'WorkInProject.ModifiedBy.ModifiedById': opts['workInProjectModifiedByModifiedById'],
        'WorkInProject.ModifiedBy.ModifiedBy': opts['workInProjectModifiedByModifiedBy'],
        'WorkInProject.ModifiedBy.EntityState': opts['workInProjectModifiedByEntityState'],
        'WorkInProject.EntityState': opts['workInProjectEntityState'],
        'Id': opts['id'],
        'CreatedOn': opts['createdOn'],
        'CreatedById': opts['createdById'],
        'CreatedBy.Login': opts['createdByLogin'],
        'CreatedBy.Password': opts['createdByPassword'],
        'CreatedBy.LastSyncDate': opts['createdByLastSyncDate'],
        'CreatedBy.EndSystemRecordId': opts['createdByEndSystemRecordId'],
        'CreatedBy.IsSynchronized': opts['createdByIsSynchronized'],
        'CreatedBy.IsIntegration': opts['createdByIsIntegration'],
        'CreatedBy.NeedUpdateRemoteIds': opts['createdByNeedUpdateRemoteIds'],
        'CreatedBy.Name': opts['createdByName'],
        'CreatedBy.Id': opts['createdById2'],
        'CreatedBy.CreatedOn': opts['createdByCreatedOn'],
        'CreatedBy.CreatedById': opts['createdByCreatedById'],
        'CreatedBy.CreatedBy': opts['createdByCreatedBy'],
        'CreatedBy.ModifiedOn': opts['createdByModifiedOn'],
        'CreatedBy.ModifiedById': opts['createdByModifiedById'],
        'CreatedBy.ModifiedBy': opts['createdByModifiedBy'],
        'CreatedBy.EntityState': opts['createdByEntityState'],
        'ModifiedOn': opts['modifiedOn'],
        'ModifiedById': opts['modifiedById'],
        'ModifiedBy.Login': opts['modifiedByLogin'],
        'ModifiedBy.Password': opts['modifiedByPassword'],
        'ModifiedBy.LastSyncDate': opts['modifiedByLastSyncDate'],
        'ModifiedBy.EndSystemRecordId': opts['modifiedByEndSystemRecordId'],
        'ModifiedBy.IsSynchronized': opts['modifiedByIsSynchronized'],
        'ModifiedBy.IsIntegration': opts['modifiedByIsIntegration'],
        'ModifiedBy.NeedUpdateRemoteIds': opts['modifiedByNeedUpdateRemoteIds'],
        'ModifiedBy.Name': opts['modifiedByName'],
        'ModifiedBy.Id': opts['modifiedById2'],
        'ModifiedBy.CreatedOn': opts['modifiedByCreatedOn'],
        'ModifiedBy.CreatedById': opts['modifiedByCreatedById'],
        'ModifiedBy.CreatedBy': opts['modifiedByCreatedBy'],
        'ModifiedBy.ModifiedOn': opts['modifiedByModifiedOn'],
        'ModifiedBy.ModifiedById': opts['modifiedByModifiedById'],
        'ModifiedBy.ModifiedBy': opts['modifiedByModifiedBy'],
        'ModifiedBy.EntityState': opts['modifiedByEntityState'],
        'EntityState': opts['entityState'],
      };
      var collectionQueryParams = {
        'User.UserInSystems': {
          value: opts['userUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.Activities': {
          value: opts['userActivities'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.UserInSystems': {
          value: opts['userCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.Activities': {
          value: opts['userCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.ModifiedBy.UserInSystems': {
          value: opts['userCreatedByModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.ModifiedBy.Activities': {
          value: opts['userCreatedByModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'Tags': {
          value: opts['tags'],
          collectionFormat: 'multi'
        },
        'TagInActivities': {
          value: opts['tagInActivities'],
          collectionFormat: 'multi'
        },
        'Account.CreatedBy.UserInSystems': {
          value: opts['accountCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Account.CreatedBy.Activities': {
          value: opts['accountCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'Account.ModifiedBy.UserInSystems': {
          value: opts['accountModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Account.ModifiedBy.Activities': {
          value: opts['accountModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'Project.CreatedBy.UserInSystems': {
          value: opts['projectCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Project.CreatedBy.Activities': {
          value: opts['projectCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'Project.ModifiedBy.UserInSystems': {
          value: opts['projectModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Project.ModifiedBy.Activities': {
          value: opts['projectModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'WorkInProject.CreatedBy.UserInSystems': {
          value: opts['workInProjectCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'WorkInProject.CreatedBy.Activities': {
          value: opts['workInProjectCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'WorkInProject.ModifiedBy.UserInSystems': {
          value: opts['workInProjectModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'WorkInProject.ModifiedBy.Activities': {
          value: opts['workInProjectModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'CreatedBy.UserInSystems': {
          value: opts['createdByUserInSystems'],
          collectionFormat: 'multi'
        },
        'CreatedBy.Activities': {
          value: opts['createdByActivities'],
          collectionFormat: 'multi'
        },
        'ModifiedBy.UserInSystems': {
          value: opts['modifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'ModifiedBy.Activities': {
          value: opts['modifiedByActivities'],
          collectionFormat: 'multi'
        },
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Activity/Start', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityStopByIdPost operation.
     * @callback module:api/ActivityApi~apiActivityStopByIdPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {String} opts.id 
     * @param {module:api/ActivityApi~apiActivityStopByIdPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiActivityStopByIdPost = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'id': opts['id'],
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/Activity/StopById', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiActivityStopPost operation.
     * @callback module:api/ActivityApi~apiActivityStopPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.activity 
     * @param {module:api/ActivityApi~apiActivityStopPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiActivityStopPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['activity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/Activity/Stop', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Activity":30}],19:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Activity'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.CurrentActivityApi = factory(root.MyApi.ApiClient, root.MyApi.Activity);
  }
}(this, function(ApiClient, Activity) {
  'use strict';

  /**
   * CurrentActivity service.
   * @module api/CurrentActivityApi
   * @version v1
   */

  /**
   * Constructs a new CurrentActivityApi. 
   * @alias module:api/CurrentActivityApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiCurrentActivityAddPost operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/CurrentActivityApi~apiCurrentActivityAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiCurrentActivityAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/CurrentActivity/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityEditPut operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/CurrentActivityApi~apiCurrentActivityEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiCurrentActivityEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityGetByIdGet operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/CurrentActivityApi~apiCurrentActivityGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiCurrentActivityGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiCurrentActivityGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityGetCurrentGet operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityGetCurrentGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/CurrentActivityApi~apiCurrentActivityGetCurrentGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiCurrentActivityGetCurrentGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/CurrentActivity/GetCurrent', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityGetGet operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/CurrentActivityApi~apiCurrentActivityGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiCurrentActivityGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/CurrentActivity/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityPausePost operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityPausePostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/CurrentActivityApi~apiCurrentActivityPausePostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiCurrentActivityPausePost = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Pause', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityRemoveByIdDelete operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/CurrentActivityApi~apiCurrentActivityRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiCurrentActivityRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiCurrentActivityRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityRemoveDelete operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/CurrentActivityApi~apiCurrentActivityRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiCurrentActivityRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiCurrentActivityStopPost operation.
     * @callback module:api/CurrentActivityApi~apiCurrentActivityStopPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/CurrentActivityApi~apiCurrentActivityStopPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiCurrentActivityStopPost = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/CurrentActivity/Stop', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Activity":30}],20:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/EndSystem'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/EndSystem'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.EndSystemApi = factory(root.MyApi.ApiClient, root.MyApi.EndSystem);
  }
}(this, function(ApiClient, EndSystem) {
  'use strict';

  /**
   * EndSystem service.
   * @module api/EndSystemApi
   * @version v1
   */

  /**
   * Constructs a new EndSystemApi. 
   * @alias module:api/EndSystemApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiEndSystemAddPost operation.
     * @callback module:api/EndSystemApi~apiEndSystemAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/EndSystem} opts.entity 
     * @param {module:api/EndSystemApi~apiEndSystemAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiEndSystemAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/EndSystem/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiEndSystemEditPut operation.
     * @callback module:api/EndSystemApi~apiEndSystemEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/EndSystem} opts.entity 
     * @param {module:api/EndSystemApi~apiEndSystemEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiEndSystemEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/EndSystem/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiEndSystemGetByIdGet operation.
     * @callback module:api/EndSystemApi~apiEndSystemGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/EndSystem} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/EndSystemApi~apiEndSystemGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/EndSystem}
     */
    this.apiEndSystemGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiEndSystemGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = EndSystem;

      return this.apiClient.callApi(
        '/api/EndSystem/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiEndSystemGetGet operation.
     * @callback module:api/EndSystemApi~apiEndSystemGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/EndSystem>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/EndSystemApi~apiEndSystemGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/EndSystem>}
     */
    this.apiEndSystemGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [EndSystem];

      return this.apiClient.callApi(
        '/api/EndSystem/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiEndSystemRemoveByIdDelete operation.
     * @callback module:api/EndSystemApi~apiEndSystemRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/EndSystemApi~apiEndSystemRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiEndSystemRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiEndSystemRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/EndSystem/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiEndSystemRemoveDelete operation.
     * @callback module:api/EndSystemApi~apiEndSystemRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/EndSystem} opts.entity 
     * @param {module:api/EndSystemApi~apiEndSystemRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiEndSystemRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/EndSystem/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/EndSystem":32}],21:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Activity'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.GeneralOperationApi = factory(root.MyApi.ApiClient, root.MyApi.Activity);
  }
}(this, function(ApiClient, Activity) {
  'use strict';

  /**
   * GeneralOperation service.
   * @module api/GeneralOperationApi
   * @version v1
   */

  /**
   * Constructs a new GeneralOperationApi. 
   * @alias module:api/GeneralOperationApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiGeneralOperationAddPost operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiGeneralOperationAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/GeneralOperation/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationCreateTagFromActivityPut operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationCreateTagFromActivityPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {String} opts.caption 
     * @param {String} opts.userId 
     * @param {String} opts.userLogin 
     * @param {String} opts.userPassword 
     * @param {Array.<Object>} opts.userUserInSystems 
     * @param {Array.<Object>} opts.userActivities 
     * @param {Date} opts.userLastSyncDate 
     * @param {String} opts.userEndSystemRecordId 
     * @param {Boolean} opts.userIsSynchronized 
     * @param {Boolean} opts.userIsIntegration 
     * @param {Boolean} opts.userNeedUpdateRemoteIds 
     * @param {String} opts.userName 
     * @param {String} opts.userId2 
     * @param {Date} opts.userCreatedOn 
     * @param {String} opts.userCreatedById 
     * @param {String} opts.userCreatedByLogin 
     * @param {String} opts.userCreatedByPassword 
     * @param {Array.<Object>} opts.userCreatedByUserInSystems 
     * @param {Array.<Object>} opts.userCreatedByActivities 
     * @param {Date} opts.userCreatedByLastSyncDate 
     * @param {String} opts.userCreatedByEndSystemRecordId 
     * @param {Boolean} opts.userCreatedByIsSynchronized 
     * @param {Boolean} opts.userCreatedByIsIntegration 
     * @param {Boolean} opts.userCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.userCreatedByName 
     * @param {String} opts.userCreatedById2 
     * @param {Date} opts.userCreatedByCreatedOn 
     * @param {String} opts.userCreatedByCreatedById 
     * @param {Object} opts.userCreatedByCreatedBy 
     * @param {Date} opts.userCreatedByModifiedOn 
     * @param {String} opts.userCreatedByModifiedById 
     * @param {String} opts.userCreatedByModifiedByLogin 
     * @param {String} opts.userCreatedByModifiedByPassword 
     * @param {Array.<Object>} opts.userCreatedByModifiedByUserInSystems 
     * @param {Array.<Object>} opts.userCreatedByModifiedByActivities 
     * @param {Date} opts.userCreatedByModifiedByLastSyncDate 
     * @param {String} opts.userCreatedByModifiedByEndSystemRecordId 
     * @param {Boolean} opts.userCreatedByModifiedByIsSynchronized 
     * @param {Boolean} opts.userCreatedByModifiedByIsIntegration 
     * @param {Boolean} opts.userCreatedByModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.userCreatedByModifiedByName 
     * @param {String} opts.userCreatedByModifiedById2 
     * @param {Date} opts.userCreatedByModifiedByCreatedOn 
     * @param {String} opts.userCreatedByModifiedByCreatedById 
     * @param {Object} opts.userCreatedByModifiedByCreatedBy 
     * @param {Date} opts.userCreatedByModifiedByModifiedOn 
     * @param {String} opts.userCreatedByModifiedByModifiedById 
     * @param {Object} opts.userCreatedByModifiedByModifiedBy 
     * @param {module:model/Number} opts.userCreatedByModifiedByEntityState 
     * @param {module:model/Number} opts.userCreatedByEntityState 
     * @param {Date} opts.userModifiedOn 
     * @param {String} opts.userModifiedById 
     * @param {Object} opts.userModifiedBy 
     * @param {module:model/Number} opts.userEntityState 
     * @param {Date} opts.start 
     * @param {Date} opts.end 
     * @param {module:model/Number} opts.status 
     * @param {Array.<Object>} opts.tags 
     * @param {Array.<Object>} opts.tagInActivities 
     * @param {String} opts.endSystemRecordId 
     * @param {Boolean} opts.isSynchronized 
     * @param {Boolean} opts.isIntegration 
     * @param {Boolean} opts.needUpdateRemoteIds 
     * @param {String} opts.jiraUrl 
     * @param {String} opts.accountId 
     * @param {String} opts.accountEndSystemRecordId 
     * @param {Boolean} opts.accountIsSynchronized 
     * @param {Boolean} opts.accountIsIntegration 
     * @param {Boolean} opts.accountNeedUpdateRemoteIds 
     * @param {String} opts.accountName 
     * @param {String} opts.accountId2 
     * @param {Date} opts.accountCreatedOn 
     * @param {String} opts.accountCreatedById 
     * @param {String} opts.accountCreatedByLogin 
     * @param {String} opts.accountCreatedByPassword 
     * @param {Array.<Object>} opts.accountCreatedByUserInSystems 
     * @param {Array.<Object>} opts.accountCreatedByActivities 
     * @param {Date} opts.accountCreatedByLastSyncDate 
     * @param {String} opts.accountCreatedByEndSystemRecordId 
     * @param {Boolean} opts.accountCreatedByIsSynchronized 
     * @param {Boolean} opts.accountCreatedByIsIntegration 
     * @param {Boolean} opts.accountCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.accountCreatedByName 
     * @param {String} opts.accountCreatedById2 
     * @param {Date} opts.accountCreatedByCreatedOn 
     * @param {String} opts.accountCreatedByCreatedById 
     * @param {Object} opts.accountCreatedByCreatedBy 
     * @param {Date} opts.accountCreatedByModifiedOn 
     * @param {String} opts.accountCreatedByModifiedById 
     * @param {Object} opts.accountCreatedByModifiedBy 
     * @param {module:model/Number} opts.accountCreatedByEntityState 
     * @param {Date} opts.accountModifiedOn 
     * @param {String} opts.accountModifiedById 
     * @param {String} opts.accountModifiedByLogin 
     * @param {String} opts.accountModifiedByPassword 
     * @param {Array.<Object>} opts.accountModifiedByUserInSystems 
     * @param {Array.<Object>} opts.accountModifiedByActivities 
     * @param {Date} opts.accountModifiedByLastSyncDate 
     * @param {String} opts.accountModifiedByEndSystemRecordId 
     * @param {Boolean} opts.accountModifiedByIsSynchronized 
     * @param {Boolean} opts.accountModifiedByIsIntegration 
     * @param {Boolean} opts.accountModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.accountModifiedByName 
     * @param {String} opts.accountModifiedById2 
     * @param {Date} opts.accountModifiedByCreatedOn 
     * @param {String} opts.accountModifiedByCreatedById 
     * @param {Object} opts.accountModifiedByCreatedBy 
     * @param {Date} opts.accountModifiedByModifiedOn 
     * @param {String} opts.accountModifiedByModifiedById 
     * @param {Object} opts.accountModifiedByModifiedBy 
     * @param {module:model/Number} opts.accountModifiedByEntityState 
     * @param {module:model/Number} opts.accountEntityState 
     * @param {String} opts.projectId 
     * @param {String} opts.projectEndSystemRecordId 
     * @param {Boolean} opts.projectIsSynchronized 
     * @param {Boolean} opts.projectIsIntegration 
     * @param {Boolean} opts.projectNeedUpdateRemoteIds 
     * @param {String} opts.projectName 
     * @param {String} opts.projectId2 
     * @param {Date} opts.projectCreatedOn 
     * @param {String} opts.projectCreatedById 
     * @param {String} opts.projectCreatedByLogin 
     * @param {String} opts.projectCreatedByPassword 
     * @param {Array.<Object>} opts.projectCreatedByUserInSystems 
     * @param {Array.<Object>} opts.projectCreatedByActivities 
     * @param {Date} opts.projectCreatedByLastSyncDate 
     * @param {String} opts.projectCreatedByEndSystemRecordId 
     * @param {Boolean} opts.projectCreatedByIsSynchronized 
     * @param {Boolean} opts.projectCreatedByIsIntegration 
     * @param {Boolean} opts.projectCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.projectCreatedByName 
     * @param {String} opts.projectCreatedById2 
     * @param {Date} opts.projectCreatedByCreatedOn 
     * @param {String} opts.projectCreatedByCreatedById 
     * @param {Object} opts.projectCreatedByCreatedBy 
     * @param {Date} opts.projectCreatedByModifiedOn 
     * @param {String} opts.projectCreatedByModifiedById 
     * @param {Object} opts.projectCreatedByModifiedBy 
     * @param {module:model/Number} opts.projectCreatedByEntityState 
     * @param {Date} opts.projectModifiedOn 
     * @param {String} opts.projectModifiedById 
     * @param {String} opts.projectModifiedByLogin 
     * @param {String} opts.projectModifiedByPassword 
     * @param {Array.<Object>} opts.projectModifiedByUserInSystems 
     * @param {Array.<Object>} opts.projectModifiedByActivities 
     * @param {Date} opts.projectModifiedByLastSyncDate 
     * @param {String} opts.projectModifiedByEndSystemRecordId 
     * @param {Boolean} opts.projectModifiedByIsSynchronized 
     * @param {Boolean} opts.projectModifiedByIsIntegration 
     * @param {Boolean} opts.projectModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.projectModifiedByName 
     * @param {String} opts.projectModifiedById2 
     * @param {Date} opts.projectModifiedByCreatedOn 
     * @param {String} opts.projectModifiedByCreatedById 
     * @param {Object} opts.projectModifiedByCreatedBy 
     * @param {Date} opts.projectModifiedByModifiedOn 
     * @param {String} opts.projectModifiedByModifiedById 
     * @param {Object} opts.projectModifiedByModifiedBy 
     * @param {module:model/Number} opts.projectModifiedByEntityState 
     * @param {module:model/Number} opts.projectEntityState 
     * @param {String} opts.workInProjectId 
     * @param {String} opts.workInProjectProjectId 
     * @param {String} opts.workInProjectProjectEndSystemRecordId 
     * @param {Boolean} opts.workInProjectProjectIsSynchronized 
     * @param {Boolean} opts.workInProjectProjectIsIntegration 
     * @param {Boolean} opts.workInProjectProjectNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectProjectName 
     * @param {String} opts.workInProjectProjectId2 
     * @param {Date} opts.workInProjectProjectCreatedOn 
     * @param {String} opts.workInProjectProjectCreatedById 
     * @param {Object} opts.workInProjectProjectCreatedBy 
     * @param {Date} opts.workInProjectProjectModifiedOn 
     * @param {String} opts.workInProjectProjectModifiedById 
     * @param {Object} opts.workInProjectProjectModifiedBy 
     * @param {module:model/Number} opts.workInProjectProjectEntityState 
     * @param {String} opts.workInProjectEndSystemRecordId 
     * @param {Boolean} opts.workInProjectIsSynchronized 
     * @param {Boolean} opts.workInProjectIsIntegration 
     * @param {Boolean} opts.workInProjectNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectName 
     * @param {String} opts.workInProjectId2 
     * @param {Date} opts.workInProjectCreatedOn 
     * @param {String} opts.workInProjectCreatedById 
     * @param {String} opts.workInProjectCreatedByLogin 
     * @param {String} opts.workInProjectCreatedByPassword 
     * @param {Array.<Object>} opts.workInProjectCreatedByUserInSystems 
     * @param {Array.<Object>} opts.workInProjectCreatedByActivities 
     * @param {Date} opts.workInProjectCreatedByLastSyncDate 
     * @param {String} opts.workInProjectCreatedByEndSystemRecordId 
     * @param {Boolean} opts.workInProjectCreatedByIsSynchronized 
     * @param {Boolean} opts.workInProjectCreatedByIsIntegration 
     * @param {Boolean} opts.workInProjectCreatedByNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectCreatedByName 
     * @param {String} opts.workInProjectCreatedById2 
     * @param {Date} opts.workInProjectCreatedByCreatedOn 
     * @param {String} opts.workInProjectCreatedByCreatedById 
     * @param {Object} opts.workInProjectCreatedByCreatedBy 
     * @param {Date} opts.workInProjectCreatedByModifiedOn 
     * @param {String} opts.workInProjectCreatedByModifiedById 
     * @param {Object} opts.workInProjectCreatedByModifiedBy 
     * @param {module:model/Number} opts.workInProjectCreatedByEntityState 
     * @param {Date} opts.workInProjectModifiedOn 
     * @param {String} opts.workInProjectModifiedById 
     * @param {String} opts.workInProjectModifiedByLogin 
     * @param {String} opts.workInProjectModifiedByPassword 
     * @param {Array.<Object>} opts.workInProjectModifiedByUserInSystems 
     * @param {Array.<Object>} opts.workInProjectModifiedByActivities 
     * @param {Date} opts.workInProjectModifiedByLastSyncDate 
     * @param {String} opts.workInProjectModifiedByEndSystemRecordId 
     * @param {Boolean} opts.workInProjectModifiedByIsSynchronized 
     * @param {Boolean} opts.workInProjectModifiedByIsIntegration 
     * @param {Boolean} opts.workInProjectModifiedByNeedUpdateRemoteIds 
     * @param {String} opts.workInProjectModifiedByName 
     * @param {String} opts.workInProjectModifiedById2 
     * @param {Date} opts.workInProjectModifiedByCreatedOn 
     * @param {String} opts.workInProjectModifiedByCreatedById 
     * @param {Object} opts.workInProjectModifiedByCreatedBy 
     * @param {Date} opts.workInProjectModifiedByModifiedOn 
     * @param {String} opts.workInProjectModifiedByModifiedById 
     * @param {Object} opts.workInProjectModifiedByModifiedBy 
     * @param {module:model/Number} opts.workInProjectModifiedByEntityState 
     * @param {module:model/Number} opts.workInProjectEntityState 
     * @param {String} opts.id 
     * @param {Date} opts.createdOn 
     * @param {String} opts.createdById 
     * @param {String} opts.createdByLogin 
     * @param {String} opts.createdByPassword 
     * @param {Array.<Object>} opts.createdByUserInSystems 
     * @param {Array.<Object>} opts.createdByActivities 
     * @param {Date} opts.createdByLastSyncDate 
     * @param {String} opts.createdByEndSystemRecordId 
     * @param {Boolean} opts.createdByIsSynchronized 
     * @param {Boolean} opts.createdByIsIntegration 
     * @param {Boolean} opts.createdByNeedUpdateRemoteIds 
     * @param {String} opts.createdByName 
     * @param {String} opts.createdById2 
     * @param {Date} opts.createdByCreatedOn 
     * @param {String} opts.createdByCreatedById 
     * @param {Object} opts.createdByCreatedBy 
     * @param {Date} opts.createdByModifiedOn 
     * @param {String} opts.createdByModifiedById 
     * @param {Object} opts.createdByModifiedBy 
     * @param {module:model/Number} opts.createdByEntityState 
     * @param {Date} opts.modifiedOn 
     * @param {String} opts.modifiedById 
     * @param {String} opts.modifiedByLogin 
     * @param {String} opts.modifiedByPassword 
     * @param {Array.<Object>} opts.modifiedByUserInSystems 
     * @param {Array.<Object>} opts.modifiedByActivities 
     * @param {Date} opts.modifiedByLastSyncDate 
     * @param {String} opts.modifiedByEndSystemRecordId 
     * @param {Boolean} opts.modifiedByIsSynchronized 
     * @param {Boolean} opts.modifiedByIsIntegration 
     * @param {Boolean} opts.modifiedByNeedUpdateRemoteIds 
     * @param {String} opts.modifiedByName 
     * @param {String} opts.modifiedById2 
     * @param {Date} opts.modifiedByCreatedOn 
     * @param {String} opts.modifiedByCreatedById 
     * @param {Object} opts.modifiedByCreatedBy 
     * @param {Date} opts.modifiedByModifiedOn 
     * @param {String} opts.modifiedByModifiedById 
     * @param {Object} opts.modifiedByModifiedBy 
     * @param {module:model/Number} opts.modifiedByEntityState 
     * @param {module:model/Number} opts.entityState 
     * @param {String} opts.newTagName 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationCreateTagFromActivityPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiGeneralOperationCreateTagFromActivityPut = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'Caption': opts['caption'],
        'UserId': opts['userId'],
        'User.Login': opts['userLogin'],
        'User.Password': opts['userPassword'],
        'User.LastSyncDate': opts['userLastSyncDate'],
        'User.EndSystemRecordId': opts['userEndSystemRecordId'],
        'User.IsSynchronized': opts['userIsSynchronized'],
        'User.IsIntegration': opts['userIsIntegration'],
        'User.NeedUpdateRemoteIds': opts['userNeedUpdateRemoteIds'],
        'User.Name': opts['userName'],
        'User.Id': opts['userId2'],
        'User.CreatedOn': opts['userCreatedOn'],
        'User.CreatedById': opts['userCreatedById'],
        'User.CreatedBy.Login': opts['userCreatedByLogin'],
        'User.CreatedBy.Password': opts['userCreatedByPassword'],
        'User.CreatedBy.LastSyncDate': opts['userCreatedByLastSyncDate'],
        'User.CreatedBy.EndSystemRecordId': opts['userCreatedByEndSystemRecordId'],
        'User.CreatedBy.IsSynchronized': opts['userCreatedByIsSynchronized'],
        'User.CreatedBy.IsIntegration': opts['userCreatedByIsIntegration'],
        'User.CreatedBy.NeedUpdateRemoteIds': opts['userCreatedByNeedUpdateRemoteIds'],
        'User.CreatedBy.Name': opts['userCreatedByName'],
        'User.CreatedBy.Id': opts['userCreatedById2'],
        'User.CreatedBy.CreatedOn': opts['userCreatedByCreatedOn'],
        'User.CreatedBy.CreatedById': opts['userCreatedByCreatedById'],
        'User.CreatedBy.CreatedBy': opts['userCreatedByCreatedBy'],
        'User.CreatedBy.ModifiedOn': opts['userCreatedByModifiedOn'],
        'User.CreatedBy.ModifiedById': opts['userCreatedByModifiedById'],
        'User.CreatedBy.ModifiedBy.Login': opts['userCreatedByModifiedByLogin'],
        'User.CreatedBy.ModifiedBy.Password': opts['userCreatedByModifiedByPassword'],
        'User.CreatedBy.ModifiedBy.LastSyncDate': opts['userCreatedByModifiedByLastSyncDate'],
        'User.CreatedBy.ModifiedBy.EndSystemRecordId': opts['userCreatedByModifiedByEndSystemRecordId'],
        'User.CreatedBy.ModifiedBy.IsSynchronized': opts['userCreatedByModifiedByIsSynchronized'],
        'User.CreatedBy.ModifiedBy.IsIntegration': opts['userCreatedByModifiedByIsIntegration'],
        'User.CreatedBy.ModifiedBy.NeedUpdateRemoteIds': opts['userCreatedByModifiedByNeedUpdateRemoteIds'],
        'User.CreatedBy.ModifiedBy.Name': opts['userCreatedByModifiedByName'],
        'User.CreatedBy.ModifiedBy.Id': opts['userCreatedByModifiedById2'],
        'User.CreatedBy.ModifiedBy.CreatedOn': opts['userCreatedByModifiedByCreatedOn'],
        'User.CreatedBy.ModifiedBy.CreatedById': opts['userCreatedByModifiedByCreatedById'],
        'User.CreatedBy.ModifiedBy.CreatedBy': opts['userCreatedByModifiedByCreatedBy'],
        'User.CreatedBy.ModifiedBy.ModifiedOn': opts['userCreatedByModifiedByModifiedOn'],
        'User.CreatedBy.ModifiedBy.ModifiedById': opts['userCreatedByModifiedByModifiedById'],
        'User.CreatedBy.ModifiedBy.ModifiedBy': opts['userCreatedByModifiedByModifiedBy'],
        'User.CreatedBy.ModifiedBy.EntityState': opts['userCreatedByModifiedByEntityState'],
        'User.CreatedBy.EntityState': opts['userCreatedByEntityState'],
        'User.ModifiedOn': opts['userModifiedOn'],
        'User.ModifiedById': opts['userModifiedById'],
        'User.ModifiedBy': opts['userModifiedBy'],
        'User.EntityState': opts['userEntityState'],
        'Start': opts['start'],
        'End': opts['end'],
        'Status': opts['status'],
        'EndSystemRecordId': opts['endSystemRecordId'],
        'IsSynchronized': opts['isSynchronized'],
        'IsIntegration': opts['isIntegration'],
        'NeedUpdateRemoteIds': opts['needUpdateRemoteIds'],
        'JiraUrl': opts['jiraUrl'],
        'AccountId': opts['accountId'],
        'Account.EndSystemRecordId': opts['accountEndSystemRecordId'],
        'Account.IsSynchronized': opts['accountIsSynchronized'],
        'Account.IsIntegration': opts['accountIsIntegration'],
        'Account.NeedUpdateRemoteIds': opts['accountNeedUpdateRemoteIds'],
        'Account.Name': opts['accountName'],
        'Account.Id': opts['accountId2'],
        'Account.CreatedOn': opts['accountCreatedOn'],
        'Account.CreatedById': opts['accountCreatedById'],
        'Account.CreatedBy.Login': opts['accountCreatedByLogin'],
        'Account.CreatedBy.Password': opts['accountCreatedByPassword'],
        'Account.CreatedBy.LastSyncDate': opts['accountCreatedByLastSyncDate'],
        'Account.CreatedBy.EndSystemRecordId': opts['accountCreatedByEndSystemRecordId'],
        'Account.CreatedBy.IsSynchronized': opts['accountCreatedByIsSynchronized'],
        'Account.CreatedBy.IsIntegration': opts['accountCreatedByIsIntegration'],
        'Account.CreatedBy.NeedUpdateRemoteIds': opts['accountCreatedByNeedUpdateRemoteIds'],
        'Account.CreatedBy.Name': opts['accountCreatedByName'],
        'Account.CreatedBy.Id': opts['accountCreatedById2'],
        'Account.CreatedBy.CreatedOn': opts['accountCreatedByCreatedOn'],
        'Account.CreatedBy.CreatedById': opts['accountCreatedByCreatedById'],
        'Account.CreatedBy.CreatedBy': opts['accountCreatedByCreatedBy'],
        'Account.CreatedBy.ModifiedOn': opts['accountCreatedByModifiedOn'],
        'Account.CreatedBy.ModifiedById': opts['accountCreatedByModifiedById'],
        'Account.CreatedBy.ModifiedBy': opts['accountCreatedByModifiedBy'],
        'Account.CreatedBy.EntityState': opts['accountCreatedByEntityState'],
        'Account.ModifiedOn': opts['accountModifiedOn'],
        'Account.ModifiedById': opts['accountModifiedById'],
        'Account.ModifiedBy.Login': opts['accountModifiedByLogin'],
        'Account.ModifiedBy.Password': opts['accountModifiedByPassword'],
        'Account.ModifiedBy.LastSyncDate': opts['accountModifiedByLastSyncDate'],
        'Account.ModifiedBy.EndSystemRecordId': opts['accountModifiedByEndSystemRecordId'],
        'Account.ModifiedBy.IsSynchronized': opts['accountModifiedByIsSynchronized'],
        'Account.ModifiedBy.IsIntegration': opts['accountModifiedByIsIntegration'],
        'Account.ModifiedBy.NeedUpdateRemoteIds': opts['accountModifiedByNeedUpdateRemoteIds'],
        'Account.ModifiedBy.Name': opts['accountModifiedByName'],
        'Account.ModifiedBy.Id': opts['accountModifiedById2'],
        'Account.ModifiedBy.CreatedOn': opts['accountModifiedByCreatedOn'],
        'Account.ModifiedBy.CreatedById': opts['accountModifiedByCreatedById'],
        'Account.ModifiedBy.CreatedBy': opts['accountModifiedByCreatedBy'],
        'Account.ModifiedBy.ModifiedOn': opts['accountModifiedByModifiedOn'],
        'Account.ModifiedBy.ModifiedById': opts['accountModifiedByModifiedById'],
        'Account.ModifiedBy.ModifiedBy': opts['accountModifiedByModifiedBy'],
        'Account.ModifiedBy.EntityState': opts['accountModifiedByEntityState'],
        'Account.EntityState': opts['accountEntityState'],
        'ProjectId': opts['projectId'],
        'Project.EndSystemRecordId': opts['projectEndSystemRecordId'],
        'Project.IsSynchronized': opts['projectIsSynchronized'],
        'Project.IsIntegration': opts['projectIsIntegration'],
        'Project.NeedUpdateRemoteIds': opts['projectNeedUpdateRemoteIds'],
        'Project.Name': opts['projectName'],
        'Project.Id': opts['projectId2'],
        'Project.CreatedOn': opts['projectCreatedOn'],
        'Project.CreatedById': opts['projectCreatedById'],
        'Project.CreatedBy.Login': opts['projectCreatedByLogin'],
        'Project.CreatedBy.Password': opts['projectCreatedByPassword'],
        'Project.CreatedBy.LastSyncDate': opts['projectCreatedByLastSyncDate'],
        'Project.CreatedBy.EndSystemRecordId': opts['projectCreatedByEndSystemRecordId'],
        'Project.CreatedBy.IsSynchronized': opts['projectCreatedByIsSynchronized'],
        'Project.CreatedBy.IsIntegration': opts['projectCreatedByIsIntegration'],
        'Project.CreatedBy.NeedUpdateRemoteIds': opts['projectCreatedByNeedUpdateRemoteIds'],
        'Project.CreatedBy.Name': opts['projectCreatedByName'],
        'Project.CreatedBy.Id': opts['projectCreatedById2'],
        'Project.CreatedBy.CreatedOn': opts['projectCreatedByCreatedOn'],
        'Project.CreatedBy.CreatedById': opts['projectCreatedByCreatedById'],
        'Project.CreatedBy.CreatedBy': opts['projectCreatedByCreatedBy'],
        'Project.CreatedBy.ModifiedOn': opts['projectCreatedByModifiedOn'],
        'Project.CreatedBy.ModifiedById': opts['projectCreatedByModifiedById'],
        'Project.CreatedBy.ModifiedBy': opts['projectCreatedByModifiedBy'],
        'Project.CreatedBy.EntityState': opts['projectCreatedByEntityState'],
        'Project.ModifiedOn': opts['projectModifiedOn'],
        'Project.ModifiedById': opts['projectModifiedById'],
        'Project.ModifiedBy.Login': opts['projectModifiedByLogin'],
        'Project.ModifiedBy.Password': opts['projectModifiedByPassword'],
        'Project.ModifiedBy.LastSyncDate': opts['projectModifiedByLastSyncDate'],
        'Project.ModifiedBy.EndSystemRecordId': opts['projectModifiedByEndSystemRecordId'],
        'Project.ModifiedBy.IsSynchronized': opts['projectModifiedByIsSynchronized'],
        'Project.ModifiedBy.IsIntegration': opts['projectModifiedByIsIntegration'],
        'Project.ModifiedBy.NeedUpdateRemoteIds': opts['projectModifiedByNeedUpdateRemoteIds'],
        'Project.ModifiedBy.Name': opts['projectModifiedByName'],
        'Project.ModifiedBy.Id': opts['projectModifiedById2'],
        'Project.ModifiedBy.CreatedOn': opts['projectModifiedByCreatedOn'],
        'Project.ModifiedBy.CreatedById': opts['projectModifiedByCreatedById'],
        'Project.ModifiedBy.CreatedBy': opts['projectModifiedByCreatedBy'],
        'Project.ModifiedBy.ModifiedOn': opts['projectModifiedByModifiedOn'],
        'Project.ModifiedBy.ModifiedById': opts['projectModifiedByModifiedById'],
        'Project.ModifiedBy.ModifiedBy': opts['projectModifiedByModifiedBy'],
        'Project.ModifiedBy.EntityState': opts['projectModifiedByEntityState'],
        'Project.EntityState': opts['projectEntityState'],
        'WorkInProjectId': opts['workInProjectId'],
        'WorkInProject.ProjectId': opts['workInProjectProjectId'],
        'WorkInProject.Project.EndSystemRecordId': opts['workInProjectProjectEndSystemRecordId'],
        'WorkInProject.Project.IsSynchronized': opts['workInProjectProjectIsSynchronized'],
        'WorkInProject.Project.IsIntegration': opts['workInProjectProjectIsIntegration'],
        'WorkInProject.Project.NeedUpdateRemoteIds': opts['workInProjectProjectNeedUpdateRemoteIds'],
        'WorkInProject.Project.Name': opts['workInProjectProjectName'],
        'WorkInProject.Project.Id': opts['workInProjectProjectId2'],
        'WorkInProject.Project.CreatedOn': opts['workInProjectProjectCreatedOn'],
        'WorkInProject.Project.CreatedById': opts['workInProjectProjectCreatedById'],
        'WorkInProject.Project.CreatedBy': opts['workInProjectProjectCreatedBy'],
        'WorkInProject.Project.ModifiedOn': opts['workInProjectProjectModifiedOn'],
        'WorkInProject.Project.ModifiedById': opts['workInProjectProjectModifiedById'],
        'WorkInProject.Project.ModifiedBy': opts['workInProjectProjectModifiedBy'],
        'WorkInProject.Project.EntityState': opts['workInProjectProjectEntityState'],
        'WorkInProject.EndSystemRecordId': opts['workInProjectEndSystemRecordId'],
        'WorkInProject.IsSynchronized': opts['workInProjectIsSynchronized'],
        'WorkInProject.IsIntegration': opts['workInProjectIsIntegration'],
        'WorkInProject.NeedUpdateRemoteIds': opts['workInProjectNeedUpdateRemoteIds'],
        'WorkInProject.Name': opts['workInProjectName'],
        'WorkInProject.Id': opts['workInProjectId2'],
        'WorkInProject.CreatedOn': opts['workInProjectCreatedOn'],
        'WorkInProject.CreatedById': opts['workInProjectCreatedById'],
        'WorkInProject.CreatedBy.Login': opts['workInProjectCreatedByLogin'],
        'WorkInProject.CreatedBy.Password': opts['workInProjectCreatedByPassword'],
        'WorkInProject.CreatedBy.LastSyncDate': opts['workInProjectCreatedByLastSyncDate'],
        'WorkInProject.CreatedBy.EndSystemRecordId': opts['workInProjectCreatedByEndSystemRecordId'],
        'WorkInProject.CreatedBy.IsSynchronized': opts['workInProjectCreatedByIsSynchronized'],
        'WorkInProject.CreatedBy.IsIntegration': opts['workInProjectCreatedByIsIntegration'],
        'WorkInProject.CreatedBy.NeedUpdateRemoteIds': opts['workInProjectCreatedByNeedUpdateRemoteIds'],
        'WorkInProject.CreatedBy.Name': opts['workInProjectCreatedByName'],
        'WorkInProject.CreatedBy.Id': opts['workInProjectCreatedById2'],
        'WorkInProject.CreatedBy.CreatedOn': opts['workInProjectCreatedByCreatedOn'],
        'WorkInProject.CreatedBy.CreatedById': opts['workInProjectCreatedByCreatedById'],
        'WorkInProject.CreatedBy.CreatedBy': opts['workInProjectCreatedByCreatedBy'],
        'WorkInProject.CreatedBy.ModifiedOn': opts['workInProjectCreatedByModifiedOn'],
        'WorkInProject.CreatedBy.ModifiedById': opts['workInProjectCreatedByModifiedById'],
        'WorkInProject.CreatedBy.ModifiedBy': opts['workInProjectCreatedByModifiedBy'],
        'WorkInProject.CreatedBy.EntityState': opts['workInProjectCreatedByEntityState'],
        'WorkInProject.ModifiedOn': opts['workInProjectModifiedOn'],
        'WorkInProject.ModifiedById': opts['workInProjectModifiedById'],
        'WorkInProject.ModifiedBy.Login': opts['workInProjectModifiedByLogin'],
        'WorkInProject.ModifiedBy.Password': opts['workInProjectModifiedByPassword'],
        'WorkInProject.ModifiedBy.LastSyncDate': opts['workInProjectModifiedByLastSyncDate'],
        'WorkInProject.ModifiedBy.EndSystemRecordId': opts['workInProjectModifiedByEndSystemRecordId'],
        'WorkInProject.ModifiedBy.IsSynchronized': opts['workInProjectModifiedByIsSynchronized'],
        'WorkInProject.ModifiedBy.IsIntegration': opts['workInProjectModifiedByIsIntegration'],
        'WorkInProject.ModifiedBy.NeedUpdateRemoteIds': opts['workInProjectModifiedByNeedUpdateRemoteIds'],
        'WorkInProject.ModifiedBy.Name': opts['workInProjectModifiedByName'],
        'WorkInProject.ModifiedBy.Id': opts['workInProjectModifiedById2'],
        'WorkInProject.ModifiedBy.CreatedOn': opts['workInProjectModifiedByCreatedOn'],
        'WorkInProject.ModifiedBy.CreatedById': opts['workInProjectModifiedByCreatedById'],
        'WorkInProject.ModifiedBy.CreatedBy': opts['workInProjectModifiedByCreatedBy'],
        'WorkInProject.ModifiedBy.ModifiedOn': opts['workInProjectModifiedByModifiedOn'],
        'WorkInProject.ModifiedBy.ModifiedById': opts['workInProjectModifiedByModifiedById'],
        'WorkInProject.ModifiedBy.ModifiedBy': opts['workInProjectModifiedByModifiedBy'],
        'WorkInProject.ModifiedBy.EntityState': opts['workInProjectModifiedByEntityState'],
        'WorkInProject.EntityState': opts['workInProjectEntityState'],
        'Id': opts['id'],
        'CreatedOn': opts['createdOn'],
        'CreatedById': opts['createdById'],
        'CreatedBy.Login': opts['createdByLogin'],
        'CreatedBy.Password': opts['createdByPassword'],
        'CreatedBy.LastSyncDate': opts['createdByLastSyncDate'],
        'CreatedBy.EndSystemRecordId': opts['createdByEndSystemRecordId'],
        'CreatedBy.IsSynchronized': opts['createdByIsSynchronized'],
        'CreatedBy.IsIntegration': opts['createdByIsIntegration'],
        'CreatedBy.NeedUpdateRemoteIds': opts['createdByNeedUpdateRemoteIds'],
        'CreatedBy.Name': opts['createdByName'],
        'CreatedBy.Id': opts['createdById2'],
        'CreatedBy.CreatedOn': opts['createdByCreatedOn'],
        'CreatedBy.CreatedById': opts['createdByCreatedById'],
        'CreatedBy.CreatedBy': opts['createdByCreatedBy'],
        'CreatedBy.ModifiedOn': opts['createdByModifiedOn'],
        'CreatedBy.ModifiedById': opts['createdByModifiedById'],
        'CreatedBy.ModifiedBy': opts['createdByModifiedBy'],
        'CreatedBy.EntityState': opts['createdByEntityState'],
        'ModifiedOn': opts['modifiedOn'],
        'ModifiedById': opts['modifiedById'],
        'ModifiedBy.Login': opts['modifiedByLogin'],
        'ModifiedBy.Password': opts['modifiedByPassword'],
        'ModifiedBy.LastSyncDate': opts['modifiedByLastSyncDate'],
        'ModifiedBy.EndSystemRecordId': opts['modifiedByEndSystemRecordId'],
        'ModifiedBy.IsSynchronized': opts['modifiedByIsSynchronized'],
        'ModifiedBy.IsIntegration': opts['modifiedByIsIntegration'],
        'ModifiedBy.NeedUpdateRemoteIds': opts['modifiedByNeedUpdateRemoteIds'],
        'ModifiedBy.Name': opts['modifiedByName'],
        'ModifiedBy.Id': opts['modifiedById2'],
        'ModifiedBy.CreatedOn': opts['modifiedByCreatedOn'],
        'ModifiedBy.CreatedById': opts['modifiedByCreatedById'],
        'ModifiedBy.CreatedBy': opts['modifiedByCreatedBy'],
        'ModifiedBy.ModifiedOn': opts['modifiedByModifiedOn'],
        'ModifiedBy.ModifiedById': opts['modifiedByModifiedById'],
        'ModifiedBy.ModifiedBy': opts['modifiedByModifiedBy'],
        'ModifiedBy.EntityState': opts['modifiedByEntityState'],
        'EntityState': opts['entityState'],
        'newTagName': opts['newTagName'],
      };
      var collectionQueryParams = {
        'User.UserInSystems': {
          value: opts['userUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.Activities': {
          value: opts['userActivities'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.UserInSystems': {
          value: opts['userCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.Activities': {
          value: opts['userCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.ModifiedBy.UserInSystems': {
          value: opts['userCreatedByModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'User.CreatedBy.ModifiedBy.Activities': {
          value: opts['userCreatedByModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'Tags': {
          value: opts['tags'],
          collectionFormat: 'multi'
        },
        'TagInActivities': {
          value: opts['tagInActivities'],
          collectionFormat: 'multi'
        },
        'Account.CreatedBy.UserInSystems': {
          value: opts['accountCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Account.CreatedBy.Activities': {
          value: opts['accountCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'Account.ModifiedBy.UserInSystems': {
          value: opts['accountModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Account.ModifiedBy.Activities': {
          value: opts['accountModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'Project.CreatedBy.UserInSystems': {
          value: opts['projectCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Project.CreatedBy.Activities': {
          value: opts['projectCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'Project.ModifiedBy.UserInSystems': {
          value: opts['projectModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'Project.ModifiedBy.Activities': {
          value: opts['projectModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'WorkInProject.CreatedBy.UserInSystems': {
          value: opts['workInProjectCreatedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'WorkInProject.CreatedBy.Activities': {
          value: opts['workInProjectCreatedByActivities'],
          collectionFormat: 'multi'
        },
        'WorkInProject.ModifiedBy.UserInSystems': {
          value: opts['workInProjectModifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'WorkInProject.ModifiedBy.Activities': {
          value: opts['workInProjectModifiedByActivities'],
          collectionFormat: 'multi'
        },
        'CreatedBy.UserInSystems': {
          value: opts['createdByUserInSystems'],
          collectionFormat: 'multi'
        },
        'CreatedBy.Activities': {
          value: opts['createdByActivities'],
          collectionFormat: 'multi'
        },
        'ModifiedBy.UserInSystems': {
          value: opts['modifiedByUserInSystems'],
          collectionFormat: 'multi'
        },
        'ModifiedBy.Activities': {
          value: opts['modifiedByActivities'],
          collectionFormat: 'multi'
        },
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/GeneralOperation/CreateTagFromActivity', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationEditPut operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiGeneralOperationEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/GeneralOperation/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationGetByIdGet operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiGeneralOperationGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiGeneralOperationGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/GeneralOperation/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationGetGet operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/GeneralOperationApi~apiGeneralOperationGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiGeneralOperationGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/GeneralOperation/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationRemoveByIdDelete operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiGeneralOperationRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiGeneralOperationRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/GeneralOperation/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiGeneralOperationRemoveDelete operation.
     * @callback module:api/GeneralOperationApi~apiGeneralOperationRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/GeneralOperationApi~apiGeneralOperationRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiGeneralOperationRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/GeneralOperation/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Activity":30}],22:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Activity'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.LastActivityApi = factory(root.MyApi.ApiClient, root.MyApi.Activity);
  }
}(this, function(ApiClient, Activity) {
  'use strict';

  /**
   * LastActivity service.
   * @module api/LastActivityApi
   * @version v1
   */

  /**
   * Constructs a new LastActivityApi. 
   * @alias module:api/LastActivityApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiLastActivityAddPost operation.
     * @callback module:api/LastActivityApi~apiLastActivityAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/LastActivityApi~apiLastActivityAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiLastActivityAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/LastActivity/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityContinuePut operation.
     * @callback module:api/LastActivityApi~apiLastActivityContinuePutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/LastActivityApi~apiLastActivityContinuePutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiLastActivityContinuePut = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/LastActivity/Continue', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityEditPut operation.
     * @callback module:api/LastActivityApi~apiLastActivityEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/LastActivityApi~apiLastActivityEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiLastActivityEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/LastActivity/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityGetByIdGet operation.
     * @callback module:api/LastActivityApi~apiLastActivityGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Activity} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/LastActivityApi~apiLastActivityGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Activity}
     */
    this.apiLastActivityGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiLastActivityGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Activity;

      return this.apiClient.callApi(
        '/api/LastActivity/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityGetGet operation.
     * @callback module:api/LastActivityApi~apiLastActivityGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Activity>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/LastActivityApi~apiLastActivityGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Activity>}
     */
    this.apiLastActivityGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Activity];

      return this.apiClient.callApi(
        '/api/LastActivity/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityRemoveByIdDelete operation.
     * @callback module:api/LastActivityApi~apiLastActivityRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/LastActivityApi~apiLastActivityRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiLastActivityRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiLastActivityRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/LastActivity/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityRemoveDelete operation.
     * @callback module:api/LastActivityApi~apiLastActivityRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Activity} opts.entity 
     * @param {module:api/LastActivityApi~apiLastActivityRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiLastActivityRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/LastActivity/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiLastActivityStopPut operation.
     * @callback module:api/LastActivityApi~apiLastActivityStopPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/LastActivityApi~apiLastActivityStopPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiLastActivityStopPut = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/LastActivity/Stop', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Activity":30}],23:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Project'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Project'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.ProjectApi = factory(root.MyApi.ApiClient, root.MyApi.Project);
  }
}(this, function(ApiClient, Project) {
  'use strict';

  /**
   * Project service.
   * @module api/ProjectApi
   * @version v1
   */

  /**
   * Constructs a new ProjectApi. 
   * @alias module:api/ProjectApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiProjectAddPost operation.
     * @callback module:api/ProjectApi~apiProjectAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Project} opts.entity 
     * @param {module:api/ProjectApi~apiProjectAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiProjectAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Project/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiProjectEditPut operation.
     * @callback module:api/ProjectApi~apiProjectEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Project} opts.entity 
     * @param {module:api/ProjectApi~apiProjectEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiProjectEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Project/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiProjectGetByIdGet operation.
     * @callback module:api/ProjectApi~apiProjectGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Project} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/ProjectApi~apiProjectGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Project}
     */
    this.apiProjectGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiProjectGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Project;

      return this.apiClient.callApi(
        '/api/Project/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiProjectGetGet operation.
     * @callback module:api/ProjectApi~apiProjectGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Project>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/ProjectApi~apiProjectGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Project>}
     */
    this.apiProjectGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Project];

      return this.apiClient.callApi(
        '/api/Project/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiProjectRemoveByIdDelete operation.
     * @callback module:api/ProjectApi~apiProjectRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/ProjectApi~apiProjectRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiProjectRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiProjectRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Project/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiProjectRemoveDelete operation.
     * @callback module:api/ProjectApi~apiProjectRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Project} opts.entity 
     * @param {module:api/ProjectApi~apiProjectRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiProjectRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Project/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Project":33}],24:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.SynchronizationApi = factory(root.MyApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * Synchronization service.
   * @module api/SynchronizationApi
   * @version v1
   */

  /**
   * Constructs a new SynchronizationApi. 
   * @alias module:api/SynchronizationApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiSynchronizationSyncGet operation.
     * @callback module:api/SynchronizationApi~apiSynchronizationSyncGetCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/SynchronizationApi~apiSynchronizationSyncGetCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiSynchronizationSyncGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Synchronization/Sync', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiSynchronizationSyncMeGet operation.
     * @callback module:api/SynchronizationApi~apiSynchronizationSyncMeGetCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/SynchronizationApi~apiSynchronizationSyncMeGetCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiSynchronizationSyncMeGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Synchronization/SyncMe', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16}],25:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Tag'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/Tag'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.TagApi = factory(root.MyApi.ApiClient, root.MyApi.Tag);
  }
}(this, function(ApiClient, Tag) {
  'use strict';

  /**
   * Tag service.
   * @module api/TagApi
   * @version v1
   */

  /**
   * Constructs a new TagApi. 
   * @alias module:api/TagApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiTagAddPost operation.
     * @callback module:api/TagApi~apiTagAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Tag} opts.entity 
     * @param {module:api/TagApi~apiTagAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiTagAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/Tag/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiTagEditPut operation.
     * @callback module:api/TagApi~apiTagEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Tag} opts.entity 
     * @param {module:api/TagApi~apiTagEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiTagEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Tag/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiTagGetByIdGet operation.
     * @callback module:api/TagApi~apiTagGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Tag} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/TagApi~apiTagGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/Tag}
     */
    this.apiTagGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiTagGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = Tag;

      return this.apiClient.callApi(
        '/api/Tag/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiTagGetGet operation.
     * @callback module:api/TagApi~apiTagGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Tag>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/TagApi~apiTagGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/Tag>}
     */
    this.apiTagGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [Tag];

      return this.apiClient.callApi(
        '/api/Tag/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiTagRemoveByIdDelete operation.
     * @callback module:api/TagApi~apiTagRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/TagApi~apiTagRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiTagRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiTagRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Tag/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiTagRemoveDelete operation.
     * @callback module:api/TagApi~apiTagRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/Tag} opts.entity 
     * @param {module:api/TagApi~apiTagRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiTagRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/Tag/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/Tag":34}],26:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.UserApi = factory(root.MyApi.ApiClient, root.MyApi.User);
  }
}(this, function(ApiClient, User) {
  'use strict';

  /**
   * User service.
   * @module api/UserApi
   * @version v1
   */

  /**
   * Constructs a new UserApi. 
   * @alias module:api/UserApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiUserAddPost operation.
     * @callback module:api/UserApi~apiUserAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/User} opts.entity 
     * @param {module:api/UserApi~apiUserAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiUserAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/User/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserEditPut operation.
     * @callback module:api/UserApi~apiUserEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/User} opts.entity 
     * @param {module:api/UserApi~apiUserEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/User/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserGetByIdGet operation.
     * @callback module:api/UserApi~apiUserGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/User} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/UserApi~apiUserGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/User}
     */
    this.apiUserGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiUserGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = User;

      return this.apiClient.callApi(
        '/api/User/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserGetGet operation.
     * @callback module:api/UserApi~apiUserGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/User>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/UserApi~apiUserGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/User>}
     */
    this.apiUserGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [User];

      return this.apiClient.callApi(
        '/api/User/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserRemoveByIdDelete operation.
     * @callback module:api/UserApi~apiUserRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/UserApi~apiUserRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiUserRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/User/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserRemoveDelete operation.
     * @callback module:api/UserApi~apiUserRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/User} opts.entity 
     * @param {module:api/UserApi~apiUserRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/User/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/User":36}],27:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/UserInSystem'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/UserInSystem'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.UserInSystemApi = factory(root.MyApi.ApiClient, root.MyApi.UserInSystem);
  }
}(this, function(ApiClient, UserInSystem) {
  'use strict';

  /**
   * UserInSystem service.
   * @module api/UserInSystemApi
   * @version v1
   */

  /**
   * Constructs a new UserInSystemApi. 
   * @alias module:api/UserInSystemApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the apiUserInSystemAddPost operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemAddPostCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/UserInSystem} opts.entity 
     * @param {module:api/UserInSystemApi~apiUserInSystemAddPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.apiUserInSystemAddPost = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/api/UserInSystem/Add', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserInSystemEditPut operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemEditPutCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/UserInSystem} opts.entity 
     * @param {module:api/UserInSystemApi~apiUserInSystemEditPutCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserInSystemEditPut = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/UserInSystem/Edit', 'PUT',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserInSystemGetByIdGet operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemGetByIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/UserInSystem} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/UserInSystemApi~apiUserInSystemGetByIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/UserInSystem}
     */
    this.apiUserInSystemGetByIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiUserInSystemGetByIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = UserInSystem;

      return this.apiClient.callApi(
        '/api/UserInSystem/Get/{id}', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserInSystemGetGet operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemGetGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/UserInSystem>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {module:api/UserInSystemApi~apiUserInSystemGetGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/UserInSystem>}
     */
    this.apiUserInSystemGetGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = ['text/plain', 'application/json', 'text/json'];
      var returnType = [UserInSystem];

      return this.apiClient.callApi(
        '/api/UserInSystem/Get', 'GET',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserInSystemRemoveByIdDelete operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemRemoveByIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {String} id 
     * @param {module:api/UserInSystemApi~apiUserInSystemRemoveByIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserInSystemRemoveByIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id === undefined || id === null) {
        throw new Error("Missing the required parameter 'id' when calling apiUserInSystemRemoveByIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = [];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/UserInSystem/Remove/{id}', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the apiUserInSystemRemoveDelete operation.
     * @callback module:api/UserInSystemApi~apiUserInSystemRemoveDeleteCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * @param {Object} opts Optional parameters
     * @param {module:model/UserInSystem} opts.entity 
     * @param {module:api/UserInSystemApi~apiUserInSystemRemoveDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.apiUserInSystemRemoveDelete = function(opts, callback) {
      opts = opts || {};
      var postBody = opts['entity'];


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json-patch+json', 'application/json', 'text/json', 'application/_*+json'];
      var accepts = [];
      var returnType = null;

      return this.apiClient.callApi(
        '/api/UserInSystem/Remove', 'DELETE',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":16,"../model/UserInSystem":37}],28:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Account', 'model/Activity', 'model/ActivityAdditionalInfo', 'model/EndSystem', 'model/Project', 'model/Tag', 'model/TagInActivity', 'model/User', 'model/UserInSystem', 'model/WorkInProject', 'api/AccountApi', 'api/ActivityApi', 'api/CurrentActivityApi', 'api/EndSystemApi', 'api/GeneralOperationApi', 'api/LastActivityApi', 'api/ProjectApi', 'api/SynchronizationApi', 'api/TagApi', 'api/UserApi', 'api/UserInSystemApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/Account'), require('./model/Activity'), require('./model/ActivityAdditionalInfo'), require('./model/EndSystem'), require('./model/Project'), require('./model/Tag'), require('./model/TagInActivity'), require('./model/User'), require('./model/UserInSystem'), require('./model/WorkInProject'), require('./api/AccountApi'), require('./api/ActivityApi'), require('./api/CurrentActivityApi'), require('./api/EndSystemApi'), require('./api/GeneralOperationApi'), require('./api/LastActivityApi'), require('./api/ProjectApi'), require('./api/SynchronizationApi'), require('./api/TagApi'), require('./api/UserApi'), require('./api/UserInSystemApi'));
  }
}(function(ApiClient, Account, Activity, ActivityAdditionalInfo, EndSystem, Project, Tag, TagInActivity, User, UserInSystem, WorkInProject, AccountApi, ActivityApi, CurrentActivityApi, EndSystemApi, GeneralOperationApi, LastActivityApi, ProjectApi, SynchronizationApi, TagApi, UserApi, UserInSystemApi) {
  'use strict';

  /**
   * ERROR_UNKNOWN.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var MyApi = require('index'); // See note below*.
   * var xxxSvc = new MyApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new MyApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new MyApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new MyApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version v1
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The Account model constructor.
     * @property {module:model/Account}
     */
    Account: Account,
    /**
     * The Activity model constructor.
     * @property {module:model/Activity}
     */
    Activity: Activity,
    /**
     * The ActivityAdditionalInfo model constructor.
     * @property {module:model/ActivityAdditionalInfo}
     */
    ActivityAdditionalInfo: ActivityAdditionalInfo,
    /**
     * The EndSystem model constructor.
     * @property {module:model/EndSystem}
     */
    EndSystem: EndSystem,
    /**
     * The Project model constructor.
     * @property {module:model/Project}
     */
    Project: Project,
    /**
     * The Tag model constructor.
     * @property {module:model/Tag}
     */
    Tag: Tag,
    /**
     * The TagInActivity model constructor.
     * @property {module:model/TagInActivity}
     */
    TagInActivity: TagInActivity,
    /**
     * The User model constructor.
     * @property {module:model/User}
     */
    User: User,
    /**
     * The UserInSystem model constructor.
     * @property {module:model/UserInSystem}
     */
    UserInSystem: UserInSystem,
    /**
     * The WorkInProject model constructor.
     * @property {module:model/WorkInProject}
     */
    WorkInProject: WorkInProject,
    /**
     * The AccountApi service constructor.
     * @property {module:api/AccountApi}
     */
    AccountApi: AccountApi,
    /**
     * The ActivityApi service constructor.
     * @property {module:api/ActivityApi}
     */
    ActivityApi: ActivityApi,
    /**
     * The CurrentActivityApi service constructor.
     * @property {module:api/CurrentActivityApi}
     */
    CurrentActivityApi: CurrentActivityApi,
    /**
     * The EndSystemApi service constructor.
     * @property {module:api/EndSystemApi}
     */
    EndSystemApi: EndSystemApi,
    /**
     * The GeneralOperationApi service constructor.
     * @property {module:api/GeneralOperationApi}
     */
    GeneralOperationApi: GeneralOperationApi,
    /**
     * The LastActivityApi service constructor.
     * @property {module:api/LastActivityApi}
     */
    LastActivityApi: LastActivityApi,
    /**
     * The ProjectApi service constructor.
     * @property {module:api/ProjectApi}
     */
    ProjectApi: ProjectApi,
    /**
     * The SynchronizationApi service constructor.
     * @property {module:api/SynchronizationApi}
     */
    SynchronizationApi: SynchronizationApi,
    /**
     * The TagApi service constructor.
     * @property {module:api/TagApi}
     */
    TagApi: TagApi,
    /**
     * The UserApi service constructor.
     * @property {module:api/UserApi}
     */
    UserApi: UserApi,
    /**
     * The UserInSystemApi service constructor.
     * @property {module:api/UserInSystemApi}
     */
    UserInSystemApi: UserInSystemApi
  };

  return exports;
}));

},{"./ApiClient":16,"./api/AccountApi":17,"./api/ActivityApi":18,"./api/CurrentActivityApi":19,"./api/EndSystemApi":20,"./api/GeneralOperationApi":21,"./api/LastActivityApi":22,"./api/ProjectApi":23,"./api/SynchronizationApi":24,"./api/TagApi":25,"./api/UserApi":26,"./api/UserInSystemApi":27,"./model/Account":29,"./model/Activity":30,"./model/ActivityAdditionalInfo":31,"./model/EndSystem":32,"./model/Project":33,"./model/Tag":34,"./model/TagInActivity":35,"./model/User":36,"./model/UserInSystem":37,"./model/WorkInProject":38}],29:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.Account = factory(root.MyApi.ApiClient, root.MyApi.User);
  }
}(this, function(ApiClient, User) {
  'use strict';




  /**
   * The Account model module.
   * @module model/Account
   * @version v1
   */

  /**
   * Constructs a new <code>Account</code>.
   * @alias module:model/Account
   * @class
   */
  var exports = function() {
    var _this = this;














  };

  /**
   * Constructs a <code>Account</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Account} obj Optional instance to populate.
   * @return {module:model/Account} The populated <code>Account</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/Account.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./User":36}],30:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Account', 'model/Project', 'model/Tag', 'model/TagInActivity', 'model/User', 'model/WorkInProject'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Account'), require('./Project'), require('./Tag'), require('./TagInActivity'), require('./User'), require('./WorkInProject'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.Activity = factory(root.MyApi.ApiClient, root.MyApi.Account, root.MyApi.Project, root.MyApi.Tag, root.MyApi.TagInActivity, root.MyApi.User, root.MyApi.WorkInProject);
  }
}(this, function(ApiClient, Account, Project, Tag, TagInActivity, User, WorkInProject) {
  'use strict';




  /**
   * The Activity model module.
   * @module model/Activity
   * @version v1
   */

  /**
   * Constructs a new <code>Activity</code>.
   * @alias module:model/Activity
   * @class
   */
  var exports = function() {
    var _this = this;




























  };

  /**
   * Constructs a <code>Activity</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Activity} obj Optional instance to populate.
   * @return {module:model/Activity} The populated <code>Activity</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('caption')) {
        obj['caption'] = ApiClient.convertToType(data['caption'], 'String');
      }
      if (data.hasOwnProperty('userId')) {
        obj['userId'] = ApiClient.convertToType(data['userId'], 'String');
      }
      if (data.hasOwnProperty('user')) {
        obj['user'] = User.constructFromObject(data['user']);
      }
      if (data.hasOwnProperty('start')) {
        obj['start'] = ApiClient.convertToType(data['start'], 'Date');
      }
      if (data.hasOwnProperty('end')) {
        obj['end'] = ApiClient.convertToType(data['end'], 'Date');
      }
      if (data.hasOwnProperty('status')) {
        obj['status'] = ApiClient.convertToType(data['status'], 'Number');
      }
      if (data.hasOwnProperty('tags')) {
        obj['tags'] = ApiClient.convertToType(data['tags'], [Tag]);
      }
      if (data.hasOwnProperty('tagInActivities')) {
        obj['tagInActivities'] = ApiClient.convertToType(data['tagInActivities'], [TagInActivity]);
      }
      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('jiraUrl')) {
        obj['jiraUrl'] = ApiClient.convertToType(data['jiraUrl'], 'String');
      }
      if (data.hasOwnProperty('accountId')) {
        obj['accountId'] = ApiClient.convertToType(data['accountId'], 'String');
      }
      if (data.hasOwnProperty('account')) {
        obj['account'] = Account.constructFromObject(data['account']);
      }
      if (data.hasOwnProperty('projectId')) {
        obj['projectId'] = ApiClient.convertToType(data['projectId'], 'String');
      }
      if (data.hasOwnProperty('project')) {
        obj['project'] = Project.constructFromObject(data['project']);
      }
      if (data.hasOwnProperty('workInProjectId')) {
        obj['workInProjectId'] = ApiClient.convertToType(data['workInProjectId'], 'String');
      }
      if (data.hasOwnProperty('workInProject')) {
        obj['workInProject'] = WorkInProject.constructFromObject(data['workInProject']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} caption
   */
  exports.prototype['caption'] = undefined;
  /**
   * @member {String} userId
   */
  exports.prototype['userId'] = undefined;
  /**
   * @member {module:model/User} user
   */
  exports.prototype['user'] = undefined;
  /**
   * @member {Date} start
   */
  exports.prototype['start'] = undefined;
  /**
   * @member {Date} end
   */
  exports.prototype['end'] = undefined;
  /**
   * @member {module:model/Activity.StatusEnum} status
   */
  exports.prototype['status'] = undefined;
  /**
   * @member {Array.<module:model/Tag>} tags
   */
  exports.prototype['tags'] = undefined;
  /**
   * @member {Array.<module:model/TagInActivity>} tagInActivities
   */
  exports.prototype['tagInActivities'] = undefined;
  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} jiraUrl
   */
  exports.prototype['jiraUrl'] = undefined;
  /**
   * @member {String} accountId
   */
  exports.prototype['accountId'] = undefined;
  /**
   * @member {module:model/Account} account
   */
  exports.prototype['account'] = undefined;
  /**
   * @member {String} projectId
   */
  exports.prototype['projectId'] = undefined;
  /**
   * @member {module:model/Project} project
   */
  exports.prototype['project'] = undefined;
  /**
   * @member {String} workInProjectId
   */
  exports.prototype['workInProjectId'] = undefined;
  /**
   * @member {module:model/WorkInProject} workInProject
   */
  exports.prototype['workInProject'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/Activity.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>status</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.StatusEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };

  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Account":29,"./Project":33,"./Tag":34,"./TagInActivity":35,"./User":36,"./WorkInProject":38}],31:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Account', 'model/Project', 'model/Tag', 'model/User', 'model/WorkInProject'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Account'), require('./Project'), require('./Tag'), require('./User'), require('./WorkInProject'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.ActivityAdditionalInfo = factory(root.MyApi.ApiClient, root.MyApi.Account, root.MyApi.Project, root.MyApi.Tag, root.MyApi.User, root.MyApi.WorkInProject);
  }
}(this, function(ApiClient, Account, Project, Tag, User, WorkInProject) {
  'use strict';




  /**
   * The ActivityAdditionalInfo model module.
   * @module model/ActivityAdditionalInfo
   * @version v1
   */

  /**
   * Constructs a new <code>ActivityAdditionalInfo</code>.
   * @alias module:model/ActivityAdditionalInfo
   * @class
   */
  var exports = function() {
    var _this = this;

















  };

  /**
   * Constructs a <code>ActivityAdditionalInfo</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ActivityAdditionalInfo} obj Optional instance to populate.
   * @return {module:model/ActivityAdditionalInfo} The populated <code>ActivityAdditionalInfo</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('tags')) {
        obj['tags'] = ApiClient.convertToType(data['tags'], [Tag]);
      }
      if (data.hasOwnProperty('jiraUrl')) {
        obj['jiraUrl'] = ApiClient.convertToType(data['jiraUrl'], 'String');
      }
      if (data.hasOwnProperty('accountId')) {
        obj['accountId'] = ApiClient.convertToType(data['accountId'], 'String');
      }
      if (data.hasOwnProperty('account')) {
        obj['account'] = Account.constructFromObject(data['account']);
      }
      if (data.hasOwnProperty('projectId')) {
        obj['projectId'] = ApiClient.convertToType(data['projectId'], 'String');
      }
      if (data.hasOwnProperty('project')) {
        obj['project'] = Project.constructFromObject(data['project']);
      }
      if (data.hasOwnProperty('workInProjectId')) {
        obj['workInProjectId'] = ApiClient.convertToType(data['workInProjectId'], 'String');
      }
      if (data.hasOwnProperty('workInProject')) {
        obj['workInProject'] = WorkInProject.constructFromObject(data['workInProject']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/Tag>} tags
   */
  exports.prototype['tags'] = undefined;
  /**
   * @member {String} jiraUrl
   */
  exports.prototype['jiraUrl'] = undefined;
  /**
   * @member {String} accountId
   */
  exports.prototype['accountId'] = undefined;
  /**
   * @member {module:model/Account} account
   */
  exports.prototype['account'] = undefined;
  /**
   * @member {String} projectId
   */
  exports.prototype['projectId'] = undefined;
  /**
   * @member {module:model/Project} project
   */
  exports.prototype['project'] = undefined;
  /**
   * @member {String} workInProjectId
   */
  exports.prototype['workInProjectId'] = undefined;
  /**
   * @member {module:model/WorkInProject} workInProject
   */
  exports.prototype['workInProject'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/ActivityAdditionalInfo.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Account":29,"./Project":33,"./Tag":34,"./User":36,"./WorkInProject":38}],32:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.EndSystem = factory(root.MyApi.ApiClient, root.MyApi.User);
  }
}(this, function(ApiClient, User) {
  'use strict';




  /**
   * The EndSystem model module.
   * @module model/EndSystem
   * @version v1
   */

  /**
   * Constructs a new <code>EndSystem</code>.
   * @alias module:model/EndSystem
   * @class
   */
  var exports = function() {
    var _this = this;










  };

  /**
   * Constructs a <code>EndSystem</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/EndSystem} obj Optional instance to populate.
   * @return {module:model/EndSystem} The populated <code>EndSystem</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/EndSystem.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./User":36}],33:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.Project = factory(root.MyApi.ApiClient, root.MyApi.User);
  }
}(this, function(ApiClient, User) {
  'use strict';




  /**
   * The Project model module.
   * @module model/Project
   * @version v1
   */

  /**
   * Constructs a new <code>Project</code>.
   * @alias module:model/Project
   * @class
   */
  var exports = function() {
    var _this = this;














  };

  /**
   * Constructs a <code>Project</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Project} obj Optional instance to populate.
   * @return {module:model/Project} The populated <code>Project</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/Project.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./User":36}],34:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity', 'model/ActivityAdditionalInfo', 'model/TagInActivity', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Activity'), require('./ActivityAdditionalInfo'), require('./TagInActivity'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.Tag = factory(root.MyApi.ApiClient, root.MyApi.Activity, root.MyApi.ActivityAdditionalInfo, root.MyApi.TagInActivity, root.MyApi.User);
  }
}(this, function(ApiClient, Activity, ActivityAdditionalInfo, TagInActivity, User) {
  'use strict';




  /**
   * The Tag model module.
   * @module model/Tag
   * @version v1
   */

  /**
   * Constructs a new <code>Tag</code>.
   * @alias module:model/Tag
   * @class
   */
  var exports = function() {
    var _this = this;














  };

  /**
   * Constructs a <code>Tag</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Tag} obj Optional instance to populate.
   * @return {module:model/Tag} The populated <code>Tag</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('activityAdditionalInfoId')) {
        obj['activityAdditionalInfoId'] = ApiClient.convertToType(data['activityAdditionalInfoId'], 'String');
      }
      if (data.hasOwnProperty('activityAdditionalInfo')) {
        obj['activityAdditionalInfo'] = ActivityAdditionalInfo.constructFromObject(data['activityAdditionalInfo']);
      }
      if (data.hasOwnProperty('tagInActivities')) {
        obj['tagInActivities'] = ApiClient.convertToType(data['tagInActivities'], [TagInActivity]);
      }
      if (data.hasOwnProperty('activities')) {
        obj['activities'] = ApiClient.convertToType(data['activities'], [Activity]);
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} activityAdditionalInfoId
   */
  exports.prototype['activityAdditionalInfoId'] = undefined;
  /**
   * @member {module:model/ActivityAdditionalInfo} activityAdditionalInfo
   */
  exports.prototype['activityAdditionalInfo'] = undefined;
  /**
   * @member {Array.<module:model/TagInActivity>} tagInActivities
   */
  exports.prototype['tagInActivities'] = undefined;
  /**
   * @member {Array.<module:model/Activity>} activities
   */
  exports.prototype['activities'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/Tag.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Activity":30,"./ActivityAdditionalInfo":31,"./TagInActivity":35,"./User":36}],35:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity', 'model/Tag', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Activity'), require('./Tag'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.TagInActivity = factory(root.MyApi.ApiClient, root.MyApi.Activity, root.MyApi.Tag, root.MyApi.User);
  }
}(this, function(ApiClient, Activity, Tag, User) {
  'use strict';




  /**
   * The TagInActivity model module.
   * @module model/TagInActivity
   * @version v1
   */

  /**
   * Constructs a new <code>TagInActivity</code>.
   * @alias module:model/TagInActivity
   * @class
   */
  var exports = function() {
    var _this = this;













  };

  /**
   * Constructs a <code>TagInActivity</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/TagInActivity} obj Optional instance to populate.
   * @return {module:model/TagInActivity} The populated <code>TagInActivity</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('activityId')) {
        obj['activityId'] = ApiClient.convertToType(data['activityId'], 'String');
      }
      if (data.hasOwnProperty('tagId')) {
        obj['tagId'] = ApiClient.convertToType(data['tagId'], 'String');
      }
      if (data.hasOwnProperty('activity')) {
        obj['activity'] = Activity.constructFromObject(data['activity']);
      }
      if (data.hasOwnProperty('tag')) {
        obj['tag'] = Tag.constructFromObject(data['tag']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} activityId
   */
  exports.prototype['activityId'] = undefined;
  /**
   * @member {String} tagId
   */
  exports.prototype['tagId'] = undefined;
  /**
   * @member {module:model/Activity} activity
   */
  exports.prototype['activity'] = undefined;
  /**
   * @member {module:model/Tag} tag
   */
  exports.prototype['tag'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/TagInActivity.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Activity":30,"./Tag":34,"./User":36}],36:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Activity', 'model/User', 'model/UserInSystem'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Activity'), require('./User'), require('./UserInSystem'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.User = factory(root.MyApi.ApiClient, root.MyApi.Activity, root.MyApi.User, root.MyApi.UserInSystem);
  }
}(this, function(ApiClient, Activity, User, UserInSystem) {
  'use strict';




  /**
   * The User model module.
   * @module model/User
   * @version v1
   */

  /**
   * Constructs a new <code>User</code>.
   * @alias module:model/User
   * @class
   */
  var exports = function() {
    var _this = this;



















  };

  /**
   * Constructs a <code>User</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/User} obj Optional instance to populate.
   * @return {module:model/User} The populated <code>User</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('login')) {
        obj['login'] = ApiClient.convertToType(data['login'], 'String');
      }
      if (data.hasOwnProperty('password')) {
        obj['password'] = ApiClient.convertToType(data['password'], 'String');
      }
      if (data.hasOwnProperty('userInSystems')) {
        obj['userInSystems'] = ApiClient.convertToType(data['userInSystems'], [UserInSystem]);
      }
      if (data.hasOwnProperty('activities')) {
        obj['activities'] = ApiClient.convertToType(data['activities'], [Activity]);
      }
      if (data.hasOwnProperty('lastSyncDate')) {
        obj['lastSyncDate'] = ApiClient.convertToType(data['lastSyncDate'], 'Date');
      }
      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} login
   */
  exports.prototype['login'] = undefined;
  /**
   * @member {String} password
   */
  exports.prototype['password'] = undefined;
  /**
   * @member {Array.<module:model/UserInSystem>} userInSystems
   */
  exports.prototype['userInSystems'] = undefined;
  /**
   * @member {Array.<module:model/Activity>} activities
   */
  exports.prototype['activities'] = undefined;
  /**
   * @member {Date} lastSyncDate
   */
  exports.prototype['lastSyncDate'] = undefined;
  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/User.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Activity":30,"./User":36,"./UserInSystem":37}],37:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/EndSystem', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./EndSystem'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.UserInSystem = factory(root.MyApi.ApiClient, root.MyApi.EndSystem, root.MyApi.User);
  }
}(this, function(ApiClient, EndSystem, User) {
  'use strict';




  /**
   * The UserInSystem model module.
   * @module model/UserInSystem
   * @version v1
   */

  /**
   * Constructs a new <code>UserInSystem</code>.
   * @alias module:model/UserInSystem
   * @class
   * @param user {module:model/User} 
   * @param key {String} 
   */
  var exports = function(user, key) {
    var _this = this;


    _this['user'] = user;


    _this['key'] = key;












  };

  /**
   * Constructs a <code>UserInSystem</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserInSystem} obj Optional instance to populate.
   * @return {module:model/UserInSystem} The populated <code>UserInSystem</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('userId')) {
        obj['userId'] = ApiClient.convertToType(data['userId'], 'String');
      }
      if (data.hasOwnProperty('user')) {
        obj['user'] = User.constructFromObject(data['user']);
      }
      if (data.hasOwnProperty('endSystemId')) {
        obj['endSystemId'] = ApiClient.convertToType(data['endSystemId'], 'String');
      }
      if (data.hasOwnProperty('endSystem')) {
        obj['endSystem'] = EndSystem.constructFromObject(data['endSystem']);
      }
      if (data.hasOwnProperty('key')) {
        obj['key'] = ApiClient.convertToType(data['key'], 'String');
      }
      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} userId
   */
  exports.prototype['userId'] = undefined;
  /**
   * @member {module:model/User} user
   */
  exports.prototype['user'] = undefined;
  /**
   * @member {String} endSystemId
   */
  exports.prototype['endSystemId'] = undefined;
  /**
   * @member {module:model/EndSystem} endSystem
   */
  exports.prototype['endSystem'] = undefined;
  /**
   * @member {String} key
   */
  exports.prototype['key'] = undefined;
  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/UserInSystem.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./EndSystem":32,"./User":36}],38:[function(require,module,exports){
/**
 * My API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.8
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Project', 'model/User'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Project'), require('./User'));
  } else {
    // Browser globals (root is window)
    if (!root.MyApi) {
      root.MyApi = {};
    }
    root.MyApi.WorkInProject = factory(root.MyApi.ApiClient, root.MyApi.Project, root.MyApi.User);
  }
}(this, function(ApiClient, Project, User) {
  'use strict';




  /**
   * The WorkInProject model module.
   * @module model/WorkInProject
   * @version v1
   */

  /**
   * Constructs a new <code>WorkInProject</code>.
   * @alias module:model/WorkInProject
   * @class
   */
  var exports = function() {
    var _this = this;
















  };

  /**
   * Constructs a <code>WorkInProject</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/WorkInProject} obj Optional instance to populate.
   * @return {module:model/WorkInProject} The populated <code>WorkInProject</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('projectId')) {
        obj['projectId'] = ApiClient.convertToType(data['projectId'], 'String');
      }
      if (data.hasOwnProperty('project')) {
        obj['project'] = Project.constructFromObject(data['project']);
      }
      if (data.hasOwnProperty('endSystemRecordId')) {
        obj['endSystemRecordId'] = ApiClient.convertToType(data['endSystemRecordId'], 'String');
      }
      if (data.hasOwnProperty('isSynchronized')) {
        obj['isSynchronized'] = ApiClient.convertToType(data['isSynchronized'], 'Boolean');
      }
      if (data.hasOwnProperty('isIntegration')) {
        obj['isIntegration'] = ApiClient.convertToType(data['isIntegration'], 'Boolean');
      }
      if (data.hasOwnProperty('needUpdateRemoteIds')) {
        obj['needUpdateRemoteIds'] = ApiClient.convertToType(data['needUpdateRemoteIds'], 'Boolean');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('createdById')) {
        obj['createdById'] = ApiClient.convertToType(data['createdById'], 'String');
      }
      if (data.hasOwnProperty('createdOn')) {
        obj['createdOn'] = ApiClient.convertToType(data['createdOn'], 'Date');
      }
      if (data.hasOwnProperty('modifiedById')) {
        obj['modifiedById'] = ApiClient.convertToType(data['modifiedById'], 'String');
      }
      if (data.hasOwnProperty('modifiedOn')) {
        obj['modifiedOn'] = ApiClient.convertToType(data['modifiedOn'], 'Date');
      }
      if (data.hasOwnProperty('createdBy')) {
        obj['createdBy'] = User.constructFromObject(data['createdBy']);
      }
      if (data.hasOwnProperty('modifiedBy')) {
        obj['modifiedBy'] = User.constructFromObject(data['modifiedBy']);
      }
      if (data.hasOwnProperty('entityState')) {
        obj['entityState'] = ApiClient.convertToType(data['entityState'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} projectId
   */
  exports.prototype['projectId'] = undefined;
  /**
   * @member {module:model/Project} project
   */
  exports.prototype['project'] = undefined;
  /**
   * @member {String} endSystemRecordId
   */
  exports.prototype['endSystemRecordId'] = undefined;
  /**
   * @member {Boolean} isSynchronized
   */
  exports.prototype['isSynchronized'] = undefined;
  /**
   * @member {Boolean} isIntegration
   */
  exports.prototype['isIntegration'] = undefined;
  /**
   * @member {Boolean} needUpdateRemoteIds
   */
  exports.prototype['needUpdateRemoteIds'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} createdById
   */
  exports.prototype['createdById'] = undefined;
  /**
   * @member {Date} createdOn
   */
  exports.prototype['createdOn'] = undefined;
  /**
   * @member {String} modifiedById
   */
  exports.prototype['modifiedById'] = undefined;
  /**
   * @member {Date} modifiedOn
   */
  exports.prototype['modifiedOn'] = undefined;
  /**
   * @member {module:model/User} createdBy
   */
  exports.prototype['createdBy'] = undefined;
  /**
   * @member {module:model/User} modifiedBy
   */
  exports.prototype['modifiedBy'] = undefined;
  /**
   * @member {module:model/WorkInProject.EntityStateEnum} entityState
   */
  exports.prototype['entityState'] = undefined;


  /**
   * Allowed values for the <code>entityState</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.EntityStateEnum = {
    /**
     * value: 0
     * @const
     */
    "0": 0,
    /**
     * value: 1
     * @const
     */
    "1": 1,
    /**
     * value: 2
     * @const
     */
    "2": 2,
    /**
     * value: 3
     * @const
     */
    "3": 3  };


  return exports;
}));



},{"../ApiClient":16,"./Project":33,"./User":36}]},{},[8]);
