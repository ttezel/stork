$(function () {

  console.log('at demo.js')

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

  var distances = []

  var locations = [].slice.call(customers)
  locations.unshift(depotLoc)

  var service = new google.maps.DistanceMatrixService()

  service.getDistanceMatrix(
    {
      origins: locations,
      destinations: locations,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false
    }, cb);

  function cb (res, status) {
    if (status !== google.maps.DistanceMatrixStatus.OK)
      return console.log('got google status:', status)

    //success
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

    var depot = []

    //remove depot from distance matrix
    distances.shift()
    distances.forEach(function (row) {
      var first = row.shift()
      depot.push(first)
    })

    console.log('distances', distances)
    console.log('depot', depot)

    var opts = {
      numWorkers: 3
    , customers: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
    , distances: distances
    , depot: depot
    , maxRouteLength: 10000
    , lengthPenalty: 1000
    }

    var stork = new Stork(opts)

    var result = stork.solve()

    var $elapsed = $('#elapsed')
      , $cost = $('#cost')
      , $solution = $('#solution')

    $elapsed.text('Elapsed time: '+result.elapsed+' ms')
    $cost.text('Cost: '+result.cost/1000+' km')
    $solution.text('Solution:')

    var palette = [ '87CEEB', 'FFFFE0', 'FFC0CB', '00FF7F', 'FFA07A', 'B57EDC' ]

    // //render solution on map
    var options = { zoom: 12, mapTypeId: google.maps.MapTypeId.ROADMAP }
    var container = $('#map-canvas')[0]

    var gmap = new google.maps.Map(container, options)
    var geocoder = new google.maps.Geocoder()

    //helper to draw marker on map
    function makeMarker (latLng, color) {
      var pinUrl = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|'+color
      var pin = new google.maps.MarkerImage(
        pinUrl
      , new google.maps.Size(21, 34)
      , new google.maps.Point(0,0)
      , new google.maps.Point(10, 34)
      )

      var shadowUrl = 'http://chart.apis.google.com/chart?chst=d_map_pin_shadow'
      var shadow = new google.maps.MarkerImage(
        shadowUrl
      , new google.maps.Size(40, 37)
      , new google.maps.Point(0, 0)
      , new google.maps.Point(12, 35)
      )
      var marker = new google.maps.Marker({ position: latLng, map: gmap, icon: pin, shadow: shadow })

      gmap.setCenter(latLng)

      return marker
    }

    function geocode (address, cb) {
      geocoder.geocode(
          { address: address }
        , function (res, status) {
          if (status !== google.maps.GeocoderStatus.OK) 
            return cb(status)

          return cb(null, res)
        })
    }

    geocode(depotLoc, function (err, res) {
      if (err) return console.log('google geocode error:', err)

      makeMarker(res[0].geometry.location, '000000')
    })

    //render solution on map
    result.solution.forEach(function (route, k) {
      var $route = $('<div class="route">')

      var txt = route.map(function (cust) { return customers[cust] }).join(' -> ')

      $route.text(txt)
      $route.css('background-color', '#'+palette[k])
      $route.appendTo($solution)

      //render routes on map
      route.forEach(function (cust, c) {
        geocode(customers[cust], function (err, res) {
          if (err) return console.log('google geocode error:', err)
          //successful geocoding - show on map
          var marker = makeMarker(res[0].geometry.location, palette[k])
          marker.title = c.toString() +' - '+customers[c]
        })  
      })
    })
  }
})
