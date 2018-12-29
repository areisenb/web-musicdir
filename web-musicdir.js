'use strict';
const pkg = require('./package.json');

// Import modules
var app = require('express')();
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var swStats = require('swagger-stats');
var compress = require('compression');
var log4js = require('log4js');
var http = require('http');
var serveStatic = require('serve-static');

const serverPort = 8106;

log4js.configure({
  appenders: { 'out': { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: 'info' } }
});

var log = log4js.getLogger ("srv-mgmt");

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers'
};

var uiOptions = {
  // find documenation here:
  // https://github.com/apigee-127/swagger-tools/blob/master/docs/Middleware.md
  swaggerUi: '/docs/web-musicdir',
  apiDocs: '/api-docs/web-musicdir'
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/web-musicdir.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

  app.use(compress());

  // Enable swagger-stats middleware with all options
  app.use(swStats.getMiddleware({
    name: 'srv-mgmt',
    version: pkg.version,
    ip: "127.0.0.1", // anyhow not used - obtaining own IP address is way to complicated
    timelineBucketDuration: 60000,
    swaggerSpec:swaggerDoc,
    uriPath: '/api/srv-mgmt/stats',
    durationBuckets: [25, 50, 100, 200, 500, 1000, 2000],
    requestSizeBuckets: [25, 50, 100, 200, 500],
    responseSizeBuckets: [25, 50, 100, 200, 500],
    apdexThreshold: 50
  }));

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi(uiOptions));

  app.use(serveStatic('client'));

  // Start the server
  http.createServer(app).listen(serverPort, function () {
    log.info(`Service ${pkg.name} - VERSION ${pkg.version} is started`);
    log.info(`Your server is listening on port ${serverPort} (http://localhost:${serverPort})`);
    log.info(`Swagger-ui is available on http://localhost:${serverPort}${uiOptions.swaggerUi}`);
  });
});

process.on('uncaughtException', (err) => {
  log.fatal(err);
});

module.exports = app;
