$(function () {

  console.log('at demo.js')

  var palette = [ '87CEEB', 'FFFFE0', 'FFC0CB', '00FF7F', 'FFA07A' ]

  var $elapsed = $('#elapsed')
    , $cost = $('#cost')
    , $solution = $('#solution')
    , $customers = $('#customers')
    , $depot = $('#depot')
    , $numWorkers = $('#numWorkers')
    , $maxRouteLength = $('#maxRouteLength')
    , $lengthPenalty = $('#lengthPenalty')
    , $stability = $('#stability')
    , $info = $('#info')
    , $options = $('#options')
    , $errorMessage = $('#errorMessage')

  //stork input arrays
  var distances = []
    , depot = []

  //render map in container
  var map = new Map('#map-canvas')

  //
  //  Solves the problem and renders the map
  //  
  function solve (opts) {
    var customers = opts.customers
    var depotLoc = opts.depotLoc

    //render depot on map
    map.geocode(depotLoc, function (err, res) {
      if (err) return console.log('google geocode error:', err)
      map.depotPos = res[0].geometry.location
      map.makeMarker(map.depotPos, 'B57EDC')
    })

    console.log('opts customers', customers)

    var locations = [].slice.call(customers)
    locations.unshift(depotLoc)

    //get distance matrix from google
    var service = new google.maps.DistanceMatrixService()

    var matrixOpts = {
      origins: locations
    , destinations: locations
    , travelMode: google.maps.TravelMode.DRIVING
    , avoidHighways: false
    , avoidTolls: false
    }

    service.getDistanceMatrix(matrixOpts, cb);

    //make REST API call to stork app and render solution in map
    function cb (res, status) {
      if (status !== google.maps.DistanceMatrixStatus.OK)
        return console.log('got google status:', status)

      //success - format google's data for REST API call to stork
      var origins = res.originAddresses
        , dests = res.destinationAddresses 

      origins.forEach(function (origin, i) {
        distances[i] = []
        var elements = res.rows[i].elements

        console.log('geocode result ', i, origin)

        elements.forEach(function (el, j) {
          var dist = el.distance.value
          distances[i].push(dist)
        })
      })

      //remove depot from distance matrix
      distances.shift()
      distances.forEach(function (row) {
        var first = row.shift()
        depot.push(first)
      })

      //build customers array for stork input
      var custs = []
        , num = distances.length

      while (num--) {
        custs.push(num)
      }
      custs.reverse()

      var storkOpts = opts
      storkOpts.customers = custs
      storkOpts.distances = distances
      storkOpts.depot = depot

      $.ajax({
        type: 'POST'
      , url: '/solve'
      , data: JSON.stringify(opts)
      , headers: {
          'content-type': 'application/json'
        }
      })
      .success(function (data) {
        var result = data

        //render solution info in left column
        $elapsed.text('Elapsed time: '+result.elapsed+' ms')
        $cost.text('Cost: '+result.cost/1000+' km')
        $solution.text('Solution:')

        //render solution on map
        result.solution.forEach(function (route, k) {
          //path for polyline drawing
          var path = [ map.depotPos ]
          var pathColor = palette[k]
          var $route = $('<div class="route">')

          var txt = route.map(function (cust) { return customers[cust] }).join(' -> ')

          //paint routes according to worker
          $route.text(txt)
          $route.css('background-color', '#'+palette[k])
          $route.appendTo($solution)

          //render route on map
          route.forEach(function (cust, c) {
            map.geocode(customers[cust], function (err, res) {
              if (err) return console.log('google geocode error:', err)
              //successful geocoding - show marker on map
              var marker = map.makeMarker(res[0].geometry.location, palette[k])
              marker.title = c.toString() +' - '+customers[c]
              path.push(res[0].geometry.location)

              if (c === route.length-1) {
                path.push(map.depotPos)
                map.makePolyline(path, pathColor)
              }
            })
          })
        })
      })
      .error(function (err) {
        console.log('POST error:', err)
      })
    }
  }

  //
  //  Fill demo with example
  //
  var depotLoc = 'Waterloo, ON'
  var customers = [
    '200 University Ave West, Waterloo ON'
  , '390 Churchill Court, Waterloo ON'
  , '319 erb Street West, Waterloo ON'
  , '220 King Street North  Waterloo, ON'
  , '316 King St N, Waterloo ON'
  , '150 University Ave West, Waterloo ON'
  , 'Wilfrid Laurier University, Waterloo ON'
  , '260 Lester Street, Waterloo ON'
  , 'MKV, Waterloo ON'
  ]

  //stork solution opts
  var opts = {
    numWorkers: 3
  , customers: customers
  , depotLoc: depotLoc
  , maxRouteLength: 20000
  , lengthPenalty: 10
  , stability: 1000
  , verbose: false
  }

  //fill out default depot & customer locations
  $depot.val(depotLoc)
  $customers.text(customers.join('\n'))
  $numWorkers.val(opts.numWorkers)
  $maxRouteLength.val(opts.maxRouteLength)
  $lengthPenalty.val(opts.lengthPenalty)
  $stability.val(opts.stability)

  //render the solution
  solve(opts)

  //solve whenever submit button is clicked
  $('button#submit').click(function () {
    map.clear()

    opts.depotLoc = $depot.val()
    opts.customers = $customers.text().split('\n')

    var inputValid = true

    function checkOpts (which, val) {
      if (Number.isNaN(parseInt(val))) {
        inputValid = false
        $errorMessage.text('Invalid entry for '+which+': '+val+'. Must be Number.')
        return false
      }
      return true
    }

    if ( checkOpts('# workers', $numWorkers.val()) )
      opts.numWorkers =  $numWorkers.val()
    if ( checkOpts('Max Route Length', $maxRouteLength.val()))
      opts.maxRouteLength = $maxRouteLength.val()
    if ( checkOpts('Length Overage Penalty', $lengthPenalty.val()))
      opts.lengthPenalty = $lengthPenalty.val()
    if ( checkOpts('Stability', $stability.val()))
      opts.stability = $stability.val()
    
    if (inputValid) {
      $errorMessage.text('')
      solve(opts)
    }
  })

})
