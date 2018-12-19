

 * ### Parameter validator
 * ### Hot reloading
 * ### Info Proxy


## doc


### paramProxy(target, conf)

Verification parameter
* *target*: Original object
* *conf*: default value
##### *index.test.js*
```javascript
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
// int,str,bool,obj,arr,db  They are Parameter Types
let {
  int: {number1},
  str: {string1},
  bool: {boolean1},
  obj: {object1},
  arr: {array1},
  db: {database1},
  anyone1,
  aab,
  RESULT,  // It is a mandatory parameter before it, after which it is an optional parameter
  xyz,
} = util.pramProxy(data)
// let aab=1
console.log(number1, string1, boolean1, object1, array1, database1, anyone1, aab, RESULT, xyz)

----------------------------------------------------------------------------------------------
> node index.test.js
1 '2' true { a: 1 } [ 1, 'a' ] '\';show tables\'' 'abc' null 'aab is null or TYPE err' null 
```

### hotReload()
hot reloading code

##### *hot-reload.js*
```javascript
let Node = (param) => {
  console.log('real-time-func',param,12)
}
Node.id = 123

module.exports = Node
```
##### *index.test.js*
```javascript
let util = require('./index')

util.hotReload()

let d = require('./hot-reload')
setInterval(() => {
  d(666) // d(66611)  Modify it  
  console.log('real-time-value',d.id)
}, 2000)

---------------------------------------------------------------------
> node index.test.js
real-time-func 666 12
real-time-value 123
hot reloaded  C:\Users\Administrator\Desktop\git\utilify\index.test.js
real-time-func 66611 12
real-time-value 123

```

### infoProxy()
console.log proxy


##### *index.test.js*
```javascript
let util = require('./index')

util.infoProxy()

console.log(123)

-----------------------------------------------------------------
> node index.test.js
123
at (C:\Users\Administrator\Desktop\git\utilify\index.test.js:38:9)
```


## test

 ```javascript

 > node index.test.js

 ```
 ## TODO

### paramProxy()

* More configuration items
* Hot updates when deleting files


### hotReload()

* Join non-updateable configuration
* Remove references

### With multiple methods...