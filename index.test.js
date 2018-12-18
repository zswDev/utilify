let util = require('./index')

let data = {
  number1: '1',
  string1: 2,
  boolean1: 'true',
  object1: {a: 1},
  array1: [1, 'a'],
  database1: ';show tables',
  anyone1: 'abc'
}
let {
  int: {number1},
  str: {string1},
  bool: {boolean1},
  obj: {object1},
  arr: {array1},
  db: {database1},
  anyone1,
  aab,
  RESULT,  // Before must be filled in, then optional
  xyz,
} = util.ParamProxy(data)
//let aab=1
console.log(number1, string1, boolean1, object1, array1, database1, anyone1, aab, RESULT, xyz)

util.hotReload()

let d = require('./hot-reload')
setInterval(() => {
  d(6661)
  console.log('real-time-value',d.id)
}, 2000)
