var Stork = require('./stork')


//
//  tests
//

var opts = {
  numWorkers: 3
, maxRouteLength: 15
, customers: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
, distances: [
    [ 0, 10, 9, 2, 4, 3, 3, 10, 8 ]
  , [ 10, 0, 2, 10, 9, 8, 9, 2, 4 ]
  , [ 9, 2, 0, 8, 5, 6, 6, 3, 4 ]
  , [ 2, 10, 8, 0, 2, 4, 2, 8, 5 ]
  , [ 4, 9, 5, 2, 0, 5, 2, 7, 6 ]  
  , [ 3, 8, 6, 4, 5, 0, 6, 4, 2 ]
  , [ 3, 9, 6, 2, 2, 6, 0, 9, 7 ]
  , [ 10, 2, 3, 8, 7, 4, 9, 0, 3 ]
  , [ 8, 4, 4, 5, 6, 2, 7, 3, 0 ]
  ]
, depot: [
  3, 3, 3, 3, 2, 3, 3, 4, 3 
  ]
}

var stork = new Stork(opts)

var result = stork.solve()

console.log('\nelapsed time: %s ms. Cost: %s', result.elapsed, result.cost)
console.log('solution:', result.solution)