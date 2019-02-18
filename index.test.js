let util = require('./index.future')

let data = {
  number1: '1',
  string1: 2,
  boolean1: 'true',
  object1: {a: 1},
  array1: [1, 'a'],
  database1: ';show tables',
  anyone1: 'abc'
}
// int,str,bool,obj,arr,db is a Parameter Types
let {
  int: {number1},
  str: {string1},
  bool: {boolean1},
  obj: {object1},
  arr: {array1},
  db: {database1},
  anyone1,
  aab,
  RESULT,  // The result is a required parameter before, and the result is an optional parameter.
  xyz,
} = util.paramProxy(data)
//let aab=1
console.log(number1, string1, boolean1, object1, array1, database1, anyone1, aab, RESULT, xyz)

util.hotReload(__dirname)

let d = require('./hot-reload')
if (!global.i) {
  global.i = 1
}

setTimeout(() => {
 // d(++global.i)
  console.log('real-time-value',d.id)
}, 2000)

d(123)

console.log(Object.keys(d))
// util.infoProxy()
// aaaa11

