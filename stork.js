

module.exports = Stork

//
function Stork (opts) {
  if (!Array.isArray(opts.customers) )
    throw new Error('customers must be Array')
  if (!Array.isArray(opts.distances) || !Array.isArray(opts.distances[0]))
    throw new Error('distances must be Array of Arrays')

  //number of delivery workers
  opts.numWorkers = opts.numWorkers || 3
  //initial temperature
  opts.temperature = opts.temperature || 0.9
  //scaling constant for temperature reduction
  opts.alpha = 0.9
  //max # of iterations to wait for an improving solution
  opts.coolTime = opts.coolTime || 20

  this.opts = opts
}

Stork.prototype.solve = function () {
  var self = this

  this.usedPatience = 0
  //generate initial solution which is
  //random ordering of customers
  this.solution = this.getRandomSolution()
  this.cost = this.getCost(this.solution)
  this.temperature = this.opts.temperature

  console.log('initial solution:', this.solution, 'cost:', this.cost)

  do {
    //run 2 iterations at each temperature
    var n = 0
    do {
      //get neighboring solution
      this.solution = this.getPermutation()
      this.cost = this.getCost(this.solution)

      console.log('permutation:', this.solution, 'cost:', this.cost)


      n++
    } while ( n <= 2 )

    //reduce temperature
    this.reduceTemperature(this.opts.method)
  } while ( !this.isCooled() )  //iterate til patience exhausted

  console.log('final solution', this.solution)
}

//
//  reduce self's temperature
//
Stork.prototype.reduceTemperature = function (method) {
  this.temperature = this.temperature*this.opts.alpha
}

//check if the system is cool (patience has been exhausted)
//increase used patience for faiure to find
//a better solution
Stork.prototype.isCooled = function () {
  this.coolTime++
  if (this.coolTime < this.opts.coolTime)
    return false
  else
    return true
}

//
//  Get a neighboring solution
//
Stork.prototype.getPermutation = function () {

  function randRange (max) {
    return Math.floor(max*Math.random())
  }

  //rand route indices
  var aRow = randRange(this.solution.length)
    , bRow = randRange(this.solution.length)

  //choose random routes to swap a customer pair
  var aRoute = this.solution[aRow]
    , bRoute = this.solution[bRow]

  var aCust = bCust = 0
  var aIndex = bIndex = 0

  //make sure to get a valid swap
  do {
    //rand customer indices
    aIndex = randRange(aRoute.length)
    bIndex = randRange(bRoute.length)

    aCust = aRoute[aIndex]
    bCust = bRoute[bIndex]
  } while (aRoute === bRoute && aCust === bCust)

  //make the swap
  var sol = [].slice.call(this.solution)

  sol[aRow][aIndex] = bCust
  sol[bRow][bIndex] = aCust

  return sol
}

//cost is the sum of distances of the routes
Stork.prototype.getCost = function (solution) {
  var self = this
    , dist = 0
    , prev = null
  solution.forEach(function (route) {
    route.forEach(function (customer) {
      if (prev) {
        //add customer-to-customer distance
        dist += self.opts.distances[prev][customer]
      } else {
        //we are starting from the depot
        //so add depot distance
        dist += self.opts.depot[customer]
      }
      prev = customer
    })
    //we accounted for the last customer
    //now add distance to return to depot
    customer = route[route.length-1]
    dist += self.opts.depot[customer]
    prev = null
  })
  return dist
}

//
//  get a random solution plan
//
Stork.prototype.getRandomSolution = function () {
  var cust = this.opts.customers
    , numWorkers = this.opts.numWorkers
    , solution = []
  
  //randomize customer order
  cust.sort(function (a, b) {
    var aNum = Math.random()
      , bNum = Math.random()
    return aNum - bNum
  })

  //distribute customers to our workers
  cust.forEach(function (customer, index) {
    var worker = index%numWorkers
    if (!solution[worker])
      solution[worker] = [ customer ]
    else
      solution[worker].push(customer)
  })
  return solution
}



//
//  tests
//

var opts = {
  customers: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
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

var stork = new Stork(opts).solve()