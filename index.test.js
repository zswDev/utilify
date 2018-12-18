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
  RESULT
} = util.ParamProxy(data)
console.log(number1, string1, boolean1, object1, array1, database1, anyone1, aab, RESULT)