function Map (el) {
  this.el = el
  this.markers = []
  this.paths = []
  var opts = { zoom: 12, mapTypeId: google.maps.MapTypeId.ROADMAP }
  var container = $(el)[0]
  this.gmap = new google.maps.Map(container, opts)
  this.geocoder = new google.maps.Geocoder()
}

Map.prototype.makeMarker = function (latLng, color) {
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
  var marker = new google.maps.Marker({ position: latLng, map: this.gmap, icon: pin, shadow: shadow })

  this.gmap.setCenter(latLng)
  this.markers.push(marker)
  return marker
}

Map.prototype.makePolyline = function (path, color) {
  var polyline = new google.maps.Polyline({ map: this.gmap, path: path, strokeColor: color })
  this.paths.push(polyline)
  return polyline
}

Map.prototype.geocode = function (address, cb) {
  this.geocoder.geocode({ address: address }, onComplete)

  function onComplete (res, status) {
    if (status !== google.maps.GeocoderStatus.OK) 
      return cb(status)

    return cb(null, res)
  }
}

Map.prototype.clear = function () {
  this.markers.forEach(function (marker) {
    marker.setMap(null)
  })
  
  this.paths.forEach(function (path) {
    path.setMap(null)
  })
}

//expose Map globally
window.Map = Map