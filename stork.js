var E = 2.718281828459045

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
  opts.stability = opts.stability || 20

  this.opts = opts
}

Stork.prototype.solve = function () {
  var t1 = Date.now()
  var self = this

  //# iterations since a new beter solution was found
  this.stability = 0
  this.temperature = this.opts.temperature
  //generate initial solution which is
  //random ordering of customers
  this.solution = this.getRandomSolution()
  this.cost = this.getCost(this.solution)

  console.log('initial solution:', this.solution, 'cost:', this.cost)

  while ( !this.isCooled() ) {
    //run 2 iterations at each temperature
    var n = 0
    
    while ( n <= 2 ) {
      this.stability++
      //get neighboring solution
      var neighbor = this.getPermutation()
        , cost = this.getCost(neighbor)
        , deltaCost = cost - this.cost

      if (deltaCost < 0) {
        //accept this solution; it's a better one
        this.solution = neighbor
        this.cost = cost
        this.stability = 0

        console.log('\ngot better solution. Accepting.')
      } else {
        //determine whether to accept this worse solution
        var x = Math.random()
          , prob = Math.pow(E, -deltaCost/this.temperature)

        console.log('\ngot worse solution. deltaCost: %s prob: %s', deltaCost, prob)

        if (x < prob) {
          console.log('accepting worse solution')
          this.solution = neighbor
          this.cost = cost
          this.stability = 0
        } else {
          console.log('rejecting worse solution')
        }
      }

      console.log('solution:', this.solution, 'cost:', this.cost, 'stability', this.stability)
      n++
    }  

    //reduce temperature
    this.reduceTemperature(this.opts.method)
  }

  console.log('final solution', this.solution, 'cost:', this.cost)
}

//
//  reduce self's temperature
//
Stork.prototype.reduceTemperature = function (method) {
  this.temperature = this.temperature*this.opts.alpha
}

//check if the system is cool (patience has been exhausted)
Stork.prototype.isCooled = function () {
  var isStable = this.stability > this.opts.stability
  var isCool = this.temperature < 0.1


  if (isStable) 
    console.log('system is stable : 20 non-improving iterations')
  if (isCool) 
    console.log('system is less than 0.1 temperature')

  if (isStable && isCool)
    return true
  else
    return false
}

//
//  Get a neighboring solution
//
Stork.prototype.getPermutation = function () {

  function randRange (max) {
    return Math.floor(max*Math.random())
  }

  var aRoute = bRoute = null
  var aCust = bCust = 0
  var aIndex = bIndex = 0

  //make sure to get a valid swap
  do {
    //rand route indices
    var aRow = randRange(this.solution.length)
      , bRow = randRange(this.solution.length)

    //choose random routes to swap a customer pair from
    aRoute = this.solution[aRow]
    bRoute = this.solution[bRow]

    //rand customer indices
    aIndex = randRange(aRoute.length)
    bIndex = randRange(bRoute.length)

    //customers to swap
    aCust = aRoute[aIndex]
    bCust = bRoute[bIndex]
  } while (aRoute === bRoute && aCust === bCust)

  var sol = [].slice.call(this.solution)

  //make the swap
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