// math constant 'e'
var E = 2.718281828459045

function Stork (opts) {
  if (!Array.isArray(opts.customers) )
    throw new Error('customers must be Array')
  if (!Array.isArray(opts.distances) || !Array.isArray(opts.distances[0]))
    throw new Error('distances must be Array of Arrays')

  //number of delivery workers
  opts.numWorkers = opts.numWorkers || 3
  //initial temperature
  opts.temperature = opts.temperature || 0.9
  //iterations to run per temperature value
  opts.iterPerTemp = 5
  //temperature for system to be considered cold
  opts.coolTemp = 0.1
  //scaling constant for temperature reduction
  opts.alpha = 0.99
  //# of iterations for solution to be considered stable
  opts.stability = opts.stability || 20

  //max length for acceptable routes
  opts.maxRouteLength = opts.maxRouteLength || 0

  //penalty for route length overage
  opts.lengthPenalty = opts.lengthPenalty || 10

  this.opts = opts
}

//
//  Expose Stork API
//
if (typeof module !== 'undefined') {
  //commonjs
  module.exports = Stork
} else {
  //browser
  window.Stork = Stork
}

//
//  solve the problem
//
Stork.prototype.solve = function () {
  var t1 = Date.now()
  var i = 0
  var self = this

  //# iterations since a new beter solution was found
  this.stability = 0
  this.temperature = this.opts.temperature

  //generate initial solution (random solution)
  this.solution = this.getRandomSolution()
  this.cost = this.getCost(this.solution)

  console.log('initial solution:', this.solution, 'cost:', this.cost)

  while ( !this.isCooled() ) {
    //run n iterations at each temperature
    var n = 0
    
    while ( n <= this.opts.iterPerTemp ) {
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
          , deltaChar = String.fromCharCode(916)

        var template = '\ngot worse solution. %s cost: %s temp: %s acceptance prob: %s'

        console.log(template, deltaChar, deltaCost, this.temperature, prob)

        if (x < prob) {
          console.log('accepting worse solution')
          this.solution = neighbor
          this.cost = cost
          this.stability = 0
        } else {
          console.log('rejecting worse solution')
        }
      }

      console.log('solution #', i, ':', this.solution)
      console.log('cost:', this.cost, 'stability:', this.stability)
      n++
      i++
    }  

    //reduce temperature
    this.reduceTemperature()
  }

  var elapsed = Date.now() - t1

  return { solution: this.solution, cost: this.cost, elapsed: elapsed }
}

//
//  reduce own temperature
//
Stork.prototype.reduceTemperature = function () {
  this.temperature = this.temperature*this.opts.alpha
}

//
//  check if system is:
//  cool, stable, and solution is acceptable
//
Stork.prototype.isCooled = function () {
  var self = this
    , maxLen = this.opts.maxRouteLength

  var isStable = this.stability > this.opts.stability
  var isCool = this.temperature < this.opts.coolTemp
  
  var isAcceptable = true

  //if required, check that
  //all of the routes are of acceptable length
  if (maxLen > 0) {
    isAcceptable = this.solution.every(function (route) {
      //is route length acceptable?
      var len = self.getRouteDistance(route)
      if (len < maxLen)
        return true
      else
        return false
    })
  }

  if (isStable) 
    console.log('system is stable (>', this.opts.stability, 'non-improving iterations)')
  if (isCool) 
    console.log('system is cooled (< than 0.1 temperature)')
  if (isAcceptable)
    console.log('system routes are within acceptable length')

  if (isStable && isCool && isAcceptable)
    return true
  else
    return false
}

var EYE = 0

//
//  Get a neighboring solution
//
Stork.prototype.getPermutation = function () {

  var sol = [].slice.call(this.solution)
    , choice = Math.random()
    , numWorkers = sol.length

  var aRow = bRow = 0
  var aRoute = bRoute = null
  var aIndex = bIndex = 0
  var aCust = bCust = 0
  

  function randRange (max) {
    return Math.floor(max*Math.random())
  }

  if (choice < 0.5) { 
    //move 1 customer to another worker

    //make sure to get 2 different rows and first row is non-empty
    do {
      aRow = randRange(numWorkers)
      bRow = randRange(numWorkers)

      //routes to swap between
      aRoute = sol[aRow]
      bRoute = sol[bRow]

    } while (aRow === bRow || aRoute.length === 0)

    //rand customer index from aRow
    aIndex = randRange(aRoute.length)
    aCust = aRoute[aIndex]

    //choose random spot to insert aCust in bRoute (inclusive)
    bIndex = randRange(bRoute.length+1)
    
    //move customer from aRow to bRow
    sol[aRow].splice(aIndex, 1)
    sol[bRow].splice(bIndex, 0, aCust)
  } else {  
    //swap 2 customers

    //make sure to get a valid swap
    do {
      //rand route indices
      aRow = randRange(numWorkers)
      bRow = randRange(numWorkers)

      //choose random routes to swap a customer pair from
      aRoute = sol[aRow]
      bRoute = sol[bRow]

      //rand customer indices
      aIndex = randRange(aRoute.length)
      bIndex = randRange(bRoute.length)

      //customers to swap
      aCust = aRoute[aIndex]
      bCust = bRoute[bIndex]
    } while (aRow === bRow && aIndex === bIndex || aRoute.length === 0 || bRoute.length === 0)

    //make the swap
    sol[aRow][aIndex] = bCust
    sol[bRow][bIndex] = aCust
  }
  
  return sol
}

//
//  route (Array) -> distance (Number)
//
Stork.prototype.getRouteDistance = function (route) {
  var dist = 0
  
  if (route.length === 0)
    return dist

  var first = route[0]

  //add distance from depot to first customer in route
  dist += this.opts.depot[first]
  var prev = first

  //add the customer-to-customer distances
  for (var i = 1, j = route.length; i < j; i++) {
    var customer = route[i]
    dist += this.opts.distances[prev][customer]
    prev = customer
  }

  //add distance to return to depot
  dist += this.opts.depot[prev]

  return dist
}

//  cost is the sum of distances of the routes PLUS:
//  if a route in the solution is too long,
//  cost is increased according to
//
//  self.opts.lengthPenalty*(distance overage)
//
//  (solution) -> cost (Number)
//
Stork.prototype.getCost = function (solution) {
  var self = this
    , cost = 0
    , maxLen = this.opts.maxRouteLength

  solution.forEach(function (route) {
    var dist = self.getRouteDistance(route)
    cost += dist

    //penalize length overage (if there is one)    
    if (maxLen > 0 && dist > maxLen) {
      cost += self.opts.lengthPenalty*(dist-maxLen)
    }
  })
  return cost
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

  //assign customers to our workers (equally distributed)
  cust.forEach(function (customer, index) {
    var worker = index%numWorkers
    if (!solution[worker])
      solution[worker] = [ customer ]
    else
      solution[worker].push(customer)
  })
  return solution
}