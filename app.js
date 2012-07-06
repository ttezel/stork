var http = require('http')
  , path = require('path')
  , express = require('express')
  , Stork = require('./stork')

function App (opts) {
  this.opts = opts
  this.app = express()
  this.configure()
  this.registerRoutes()
}

App.prototype.configure = function () {
  var app = this.app
  app.configure('development', function(){
    app.use(express.bodyParser())
    app.use(express.static(__dirname + '/public'))
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
  })
}

App.prototype.registerRoutes = function () {
  var self = this
    , app = this.app

  app.get('/', function (req, res) {
    res.sendfile(path.resolve(__dirname, 'views/map.html'))
  })
  app.post('/solve', function (req, res) {
    var opts = req.body

    console.log('opts', opts)

    var stork = new Stork(opts)
    var result = stork.solve()

    res.json(result)
    res.end()
  })
}

App.prototype.start = function () {
  var port = this.opts.port
  this.app.listen(port)
  console.log('app listening on port %s', port)
}

//start the app
new App({ port: 8000 }).start()