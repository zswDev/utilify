let Node = (param) => {
  console.log('real-time-func',param)
}

Node.id = 123

module.exports = {
    ...Node,
    a: 1
}