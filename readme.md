#`Stork`

##Solves Vehicle Routing Problems

![](https://dl.dropbox.com/u/32773572/stork-map1.png)

Given a `depot` location and a set of `customer` locations, `Stork` will tell you an optimized route for your vehicles to take.

`Stork` uses the Google Maps API to get a distance matrix from the locations, and uses [Simulated Annealing](http://en.wikipedia.org/wiki/Simulated_annealing) to determine the routes for your vehicles to take.

##Install

```
npm install stork
```

##Run the server:

```javascript
var Stork = require('stork')

var stork = new Stork({ port: 8000 }).start()
```

Now you can go to `127.0.0.1:8000` in your browser, and use the web app.

You can also query the **REST** API. 

Stork exposes one REST resource:

`POST` /solve

Send the solution options as JSON. It can look like this:

```javascript
{ numWorkers: 3,
  customers: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ],
  depotLoc: 'Waterloo, ON',
  maxRouteLength: 20000,
  lengthPenalty: 10,
  stability: 1000,
  verbose: false,
  distances: 
   [ [ 0, 3084, 2024, 1950, 2128, 799, 1541, 1260, 2103 ],
     [ 5639, 0, 1060, 3777, 3956, 2626, 3369, 3087, 4088 ],
     [ 3063, 1060, 0, 3336, 3514, 2185, 2927, 2646, 4394 ],
     [ 1318, 4402, 3342, 0, 476, 1151, 409, 1241, 3289 ],
     [ 1496, 4580, 3520, 476, 0, 1329, 587, 1420, 2813 ],
     [ 167, 3251, 2191, 1151, 1329, 0, 742, 461, 2270 ],
     [ 909, 3993, 2933, 409, 587, 742, 0, 833, 3012 ],
     [ 628, 3712, 2652, 1241, 1700, 461, 833, 0, 1807 ],
     [ 2009, 4532, 3472, 3273, 2797, 1882, 2625, 1790, 0 ] ],
  depot: [ 3314, 3360, 2300, 1420, 1840, 2515, 1773, 2606, 4035 ] }
```

