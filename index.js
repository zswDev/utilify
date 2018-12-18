
(()=> {
  const _util = {}
  if (module && module.exports != undefined) {
    module.exports = _util
  } else if (typeof window !== 'undefined') {
    window.util = _util
  }

  // sql 验证

  var SqlString  = {};
  var ID_GLOBAL_REGEXP    = /`/g;
  var QUAL_GLOBAL_REGEXP  = /\./g;
  var CHARS_GLOBAL_REGEXP = /[\0\b\t\n\r\x1a\"\'\\]/g; // eslint-disable-line no-control-regex
  var CHARS_ESCAPE_MAP    = {
    '\0'   : '\\0',
    '\b'   : '\\b',
    '\t'   : '\\t',
    '\n'   : '\\n',
    '\r'   : '\\r',
    '\x1a' : '\\Z',
    '"'    : '\\"',
    '\''   : '\\\'',
    '\\'   : '\\\\'
  };
  SqlString.escapeId = function escapeId(val, forbidQualified) {
    if (Array.isArray(val)) {
      var sql = '';

      for (var i = 0; i < val.length; i++) {
        sql += (i === 0 ? '' : ', ') + SqlString.escapeId(val[i], forbidQualified);
      }

      return sql;
    } else if (forbidQualified) {
      return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``') + '`';
    } else {
      return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``').replace(QUAL_GLOBAL_REGEXP, '`.`') + '`';
    }
  };
  SqlString.escape = function escape(val, stringifyObjects, timeZone) {
    if (val === undefined || val === null) {
      return 'NULL';
    }

    switch (typeof val) {
      case 'boolean': return (val) ? 'true' : 'false';
      case 'number': return val + '';
      case 'object':
        if (val instanceof Date) {
          return SqlString.dateToString(val, timeZone || 'local');
        } else if (Array.isArray(val)) {
          return SqlString.arrayToList(val, timeZone);
        } else if (Buffer.isBuffer(val)) {
          return SqlString.bufferToString(val);
        } else if (typeof val.toSqlString === 'function') {
          return String(val.toSqlString());
        } else if (stringifyObjects) {
          return escapeString(val.toString());
        } else {
          return SqlString.objectToValues(val, timeZone);
        }
      default: return escapeString(val);
    }
  };
  SqlString.arrayToList = function arrayToList(array, timeZone) {
    var sql = '';

    for (var i = 0; i < array.length; i++) {
      var val = array[i];

      if (Array.isArray(val)) {
        sql += (i === 0 ? '' : ', ') + '(' + SqlString.arrayToList(val, timeZone) + ')';
      } else {
        sql += (i === 0 ? '' : ', ') + SqlString.escape(val, true, timeZone);
      }
    }

    return sql;
  };
  SqlString.format = function format(sql, values, stringifyObjects, timeZone) {
    if (values == null) {
      return sql;
    }

    if (!(values instanceof Array || Array.isArray(values))) {
      values = [values];
    }

    var chunkIndex        = 0;
    var placeholdersRegex = /\?+/g;
    var result            = '';
    var valuesIndex       = 0;
    var match;

    while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
      var len = match[0].length;

      if (len > 2) {
        continue;
      }

      var value = len === 2
        ? SqlString.escapeId(values[valuesIndex])
        : SqlString.escape(values[valuesIndex], stringifyObjects, timeZone);

      result += sql.slice(chunkIndex, match.index) + value;
      chunkIndex = placeholdersRegex.lastIndex;
      valuesIndex++;
    }

    if (chunkIndex === 0) {
      // Nothing was replaced
      return sql;
    }

    if (chunkIndex < sql.length) {
      return result + sql.slice(chunkIndex);
    }

    return result;
  };
  SqlString.dateToString = function dateToString(date, timeZone) {
    var dt = new Date(date);

    if (isNaN(dt.getTime())) {
      return 'NULL';
    }

    var year;
    var month;
    var day;
    var hour;
    var minute;
    var second;
    var millisecond;

    if (timeZone === 'local') {
      year        = dt.getFullYear();
      month       = dt.getMonth() + 1;
      day         = dt.getDate();
      hour        = dt.getHours();
      minute      = dt.getMinutes();
      second      = dt.getSeconds();
      millisecond = dt.getMilliseconds();
    } else {
      var tz = convertTimezone(timeZone);

      if (tz !== false && tz !== 0) {
        dt.setTime(dt.getTime() + (tz * 60000));
      }

      year       = dt.getUTCFullYear();
      month       = dt.getUTCMonth() + 1;
      day         = dt.getUTCDate();
      hour        = dt.getUTCHours();
      minute      = dt.getUTCMinutes();
      second      = dt.getUTCSeconds();
      millisecond = dt.getUTCMilliseconds();
    }

    // YYYY-MM-DD HH:mm:ss.mmm
    var str = zeroPad(year, 4) + '-' + zeroPad(month, 2) + '-' + zeroPad(day, 2) + ' ' +
      zeroPad(hour, 2) + ':' + zeroPad(minute, 2) + ':' + zeroPad(second, 2) + '.' +
      zeroPad(millisecond, 3);

    return escapeString(str);
  };
  SqlString.bufferToString = function bufferToString(buffer) {
    return 'X' + escapeString(buffer.toString('hex'));
  };
  SqlString.objectToValues = function objectToValues(object, timeZone) {
    var sql = '';

    for (var key in object) {
      var val = object[key];

      if (typeof val === 'function') {
        continue;
      }

      sql += (sql.length === 0 ? '' : ', ') + SqlString.escapeId(key) + ' = ' + SqlString.escape(val, true, timeZone);
    }

    return sql;
  };
  SqlString.raw = function raw(sql) {
    if (typeof sql !== 'string') {
      throw new TypeError('argument sql must be a string');
    }

    return {
      toSqlString: function toSqlString() { return sql; }
    };
  };
  function escapeString(val) {
    var chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex = 0;
    var escapedVal = '';
    var match;

    while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
      escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
      chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
    }

    if (chunkIndex === 0) {
      // Nothing was escaped
      return "'" + val + "'";
    }

    if (chunkIndex < val.length) {
      return "'" + escapedVal + val.slice(chunkIndex) + "'";
    }

    return "'" + escapedVal + "'";
  }
  function zeroPad(number, length) {
    number = number.toString();
    while (number.length < length) {
      number = '0' + number;
    }

    return number;
  }
  function convertTimezone(tz) {
    if (tz === 'Z') {
      return 0;
    }

    var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
    if (m) {
      return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
    }
    return false;
  }


  // 其他类型验证
  let errTypes = [
    undefined,
    null,
    ''
  ]
  let okTypes = [
    'string',
    'number',
    'boolean'
  ]
  const verify = {
    int (data) {
      data = parseInt(data)
      if (isNaN(data)) return [false, 0]
      return [true, data]
    },
    str (data) {
      data = data.toString()
      if (data === '') return [false, '']
      return [true, data]
    },
    bool (data) {
      if (typeof data !== 'boolean') {
        if (['true', 'false'].includes(data)) {
          return [true, data === 'true' ? true : false]
        }
        return [false, false]
      }
      return [true, data]
    },
    arr (data) {
      if (!Array.isArray(data) || data.length === 0) return [false, []]
      return [true, data]
    },
    obj (data) {
      if (typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) return [false, {}]
      return [true, data]
    },
    db (data) {
      let [done, value] = verify.any(data)
      return [done, SqlString.escape(value)]
    },
    any (data) {
      // 0, false 是有效值
      // 判断是否是无效类型, 即值不能设为 undefined, null,  NaN, ''  // isNaN('a') = true, obj !== obj 为 NaN

      if (errTypes.includes(data) || data !== data) return [false, null]
      if (!okTypes.includes(typeof data)) {
        if (Object.keys(data).length === 0) return [false, null] // 判断是否是 空对象 {} []
      }
      return [true, data]
    }
  }

  // conf 设置默认值
  // TODO 设置其他限制，如长度等
  _util.paramProxy = (obj, conf = {}) => {
    let _p = {}
    let _err = [] // 错误堆栈
    let _get = function (target, key) {
      let _self = this
      if (key === 'RESULT') {
        _self.must = false
        return _err.pop() // 出栈
      }

      if (typeof verify[key] === 'function') { // 是验证类型
        return new Proxy(obj, {
          get: _get.bind({...this, type: key})
        })
      } else {
        let func = verify[_self.type]
        let [done, value] = func(target[key])  // 改函数除了验证处理外，还设置了默认值
        if (_self.must) {
          if (!done) {
            if (conf[_self.type] !== undefined) { // 有默认值则不报错
              _err = false
              return conf[_self.type]
            } else {
              _err.push(`${typeof key === 'string' ? key : 'PARAM'} is null or TYPE err`) // 入栈
            }
          }
        }
        return value
      }
    }
    _p = new Proxy(obj, {
      get: _get.bind({must: true, type: 'any'})
    })
    return _p
  }
  // 总概念，利用 proxy+解构 完成参数验证 let {a,b,c} = new Proxy({},{get(){}})

  _util.hotReload = function () {
    if (typeof require === 'undefined') throw new Error('this is nodejs function')

    // 只执行一次
    if (global.HAS_WATCH) return
    global.HAS_WATCH = true

    let fs = require('fs')
    let path = require('path')
    let Module = require('module')

     // 重写定时器
    let _time_func = {
      1: [setTimeout, clearTimeout],
      2: [setInterval, clearInterval],
      3: [setImmediate, clearImmediate]
    }

    let _timer = {}

    let _p_time = (key) => {
      const _obj_time = {}
      let _func = (...param) => {
        Error.captureStackTrace(_obj_time, _func) // 传入当前函数，就不会打印当前 函数调用堆栈
        let _line = _obj_time.stack.split('at ')[1].split(' ')
        if (_line[0].length > _line[1].length) {
          _line = '(' + _line[0].replace(/\s/, ')\n')
        } else {
          _line = _line[1]
        }
        _line = _line.substring(0, _line.length - 2).substring(1, _line.length - 2).split(':')
        _line = `${_line[0]}:${_line[1]}`

        let [create, clear] = _time_func[key]
        let _t = create(...param)
        let _data = {clear, time: _t}
        if (_timer[_line]) {
          _timer[_line].push(_data)
        } else {
          _timer[_line] = [_data]
        }
        return _t
      }
      return _func
    }

    global.setTimeout = _p_time(1)
    global.setInterval = _p_time(2)
    global.setImmediate = _p_time(3)

    let r1 = require
    let r2 = Module.prototype.require
    fs.watch('./', {
      recursive: true
    }, (event, filename) => {
      let _path = path.join(__dirname, filename)
      if (event === 'change' && r1.cache[_path]) {
        let origin = r1.cache[_path]
        Reflect.deleteProperty(r1.cache, _path)

        // 清空定时器
        if (_timer[_path]) {
          _timer[_path].map((f1) => f1.clear(f1.time))
          _timer[_path] = []
        }

        try {
          r2(_path)
        } catch (e) {
          console.log(e)
          r1.cache[_path] = origin
        }
        console.log('hot reloaded ', _path)
      }
    })

    Module.prototype.require = function (_path) {
      _path = Module._resolveFilename(_path, this)
      r2(_path)
      let _p = new Proxy(() => {}, {
        get (target, key) {
          return r1.cache[_path].exports[key]
        },
        set (target, key, value) {
          // TODO 处理失败情况
          r1.cache[_path].exports[key] = value
          return true
        },
        apply (target, thisArg, argumentsList) {
          // TODO 可以获得调用该函数的文件地址， 然后该函数提供一个 热重载时执行的回调方法 来清除 events 类似的东西 或继承当前引用
          (typeof r1.cache[_path].exports === 'function') && r1.cache[_path].exports.bind(thisArg)(...argumentsList)
        }
      })
      return _p
    }
  }

  // 总概念，利用 fs.watch + require + proxy 来实现 热更新，监听改变的文件，修改require.cache ，调用时 通过proxy 动态引用
})()