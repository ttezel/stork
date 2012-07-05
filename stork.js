// math constant 'e'
var E = 2.718281828459045
var deltaChar = String.fromCharCode(916)

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
  opts.iterPerTemp = 10
  //temperature for system to be considered cold
  opts.coolTemp = 0.1
  //scaling constant for temperature reduction
  opts.alpha = 0.99
  //# of iterations for solution to be considered stable
  opts.stability = opts.stability || 200
  //max length for acceptable routes
  opts.maxRouteLength = opts.maxRouteLength || 0
  //penalty for route length overage
  opts.lengthPenalty = opts.lengthPenalty || 10
  //output style
  opts.verbose = !!opts.verbose

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

  this.log('initial solution:', this.solution, 'cost:', this.cost)

  while ( !this.isCooled() ) {
    //run n iterations at each temperature
    var n = 0
    
    while ( n <= this.opts.iterPerTemp ) {
      this.stability++
      //get neighboring solution
      var neighbor = this.getPermutation()
        , cost = this.getCost(neighbor)
        , deltaCost = cost - this.cost

      if (deltaCost <= 0) {
        //accept this solution; it's a better one
        this.solution = neighbor
        this.cost = cost

        if (deltaCost < 0)
          this.stability = 0

        this.log('\ngot better solution. %s cost: %s. Accepting.', deltaChar, deltaCost)
      } else {
        //determine whether to accept this worse solution
        var x = Math.random()
          , prob = Math.pow(E, -deltaCost/this.temperature)

        var template = '\ngot worse solution. %s cost: %s temp: %s acceptance prob: %s'

        this.log(template, deltaChar, deltaCost, this.temperature, prob)

        if (x < prob) {
          this.log('accepting worse solution')
          this.solution = neighbor
          this.cost = cost
          this.stability = 0
        } else {
          this.log('rejecting worse solution')
        }
      }

      this.log('solution #', i, ':', this.solution)
      this.log('cost:', this.cost, 'stability:', this.stability)
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
    this.log('system is stable (> %s non-improving iterations)', this.opts.stability)
  if (isCool) 
    this.log('system is cooled (< %s temperature)', this.opts.coolTemp)
  if (isAcceptable)
    this.log('system routes are acceptable length (< %s)', this.opts.maxRouteLength)

  if (isStable && isCool && isAcceptable)
    return true
  else
    return false
}

//
//  Get a neighboring solution
//
//  with 50% chance: randomly moves a customer from one worker to another worker
//  with 50% chance: randomly swaps two customers
//
Stork.prototype.getPermutation = function () {
  var sol = [].slice.call(this.solution)
    , numWorkers = sol.length

  var aRow = bRow = 0
  var aRoute = bRoute = null
  var aIndex = bIndex = 0
  var aCust = 0

  function randRange (max) {
    return Math.floor(max*Math.random())
  }

  //move 1 customer to another worker

  //make sure to get valid swap
  do {
    aRow = randRange(numWorkers)
    bRow = randRange(numWorkers)

    //routes to swap between
    aRoute = sol[aRow]
    bRoute = sol[bRow]

    //rand customer index from aRow
    aIndex = randRange(aRoute.length)
    aCust = aRoute[aIndex]

    //choose random spot to insert aCust in bRoute (inclusive)
    bIndex = randRange(bRoute.length+1)

  } while (aRow === bRow && aIndex === bIndex || aRoute.length === 0)
  
  //move customer from aRow to bRow
  sol[aRow].splice(aIndex, 1)
  sol[bRow].splice(bIndex, 0, aCust)
  
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

Stork.prototype.log = function () {
  if (this.opts.verbose)
    console.log.apply(console, [].slice.call(arguments))
}