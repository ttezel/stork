$(function () {

  console.log('at demo.js')

  var palette = [ '87CEEB', 'FFFFE0', 'FFC0CB', '00FF7F', 'FFA07A', 'B57EDC' ]

  var $elapsed = $('#elapsed')
    , $cost = $('#cost')
    , $solution = $('#solution')

  //stork input arrays
  var distances = []
    , depot = []

  //render map in container
  var map = new Map('#map-canvas')

  var depotLoc = 'Waterloo, ON'

  //render depot on map
  map.geocode(depotLoc, function (err, res) {
    if (err) return console.log('google geocode error:', err)
    map.makeMarker(res[0].geometry.location, '000000')
  })

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

      console.log(i, origin)

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

    //stork solution opts
    var opts = {
      numWorkers: 3
    , customers: custs
    , distances: distances
    , depot: depot
    , maxRouteLength: 20000
    , lengthPenalty: 10
    , stability: 1000
    , verbose: true
    }

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
        var $route = $('<div class="route">')

        var txt = route.map(function (cust) { return customers[cust] }).join(' -> ')

        //paint routes according to worker
        $route.text(txt)
        $route.css('background-color', '#'+palette[k])
        $route.appendTo($solution)

        //render routes on map
        route.forEach(function (cust, c) {
          map.geocode(customers[cust], function (err, res) {
            if (err) return console.log('google geocode error:', err)
            //successful geocoding - show marker on map
            var marker = map.makeMarker(res[0].geometry.location, palette[k])
            marker.title = c.toString() +' - '+customers[c]
          })  
        })
      })
    })
    .error(function (err) {
      console.log('POST error:', err)
    })
  }
})
