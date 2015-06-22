'use strict';

var gutil = require('gulp-util');
var lodash = require('lodash');
var nunjucks = require('nunjucks');
var through = require('through2');

var PLUGIN_NAME = 'gulp-nunjucks-api';

function configure(options) {
  var config = {
    context: {},
    extension: '.html',
    verbose: false
  };
  if (options === undefined || options === null)
    options = {};
  else
    options = lodash.cloneDeep(options);
  
  configureVerbosity(config, options);
  configureGlobals(config, options);
  configureContext(config, options);
  configureFiles(config, options);
  configureNunjucks(config, options);

  return config;
}

function configureContext(config, options) {
  var g = config.g;
  lodash.assign(config.context, g.data);
  lodash.assign(config.context, g.functions);
}

function configureFiles(config, options) {
  if (options.extension)
    config.extension = options.extension;
  if (options.src)
    config.src = options.src;
  delete options.extension;
  delete options.src;
}

function configureGlobals(config, options) {
  var g = {};
  var og = options.globals || {};
  g.data = lodash.merge({}, og.data, options.data);
  g.filters = lodash.merge({}, og.filters, options.filters);
  g.functions = lodash.merge({}, og.functions, options.functions);
  config.g = g;
  delete options.data;
  delete options.filters;
  delete options.functions;
  delete options.globals;
}

function configureNunjucks(config, options) {
  var env;
  var filters = config.g.filters;
  
  // At this point, options should only contain fields which are relevant to 
  // the nunjucks.configure api.
  
  // Disable watch by default for the gulp system, since gulp will not exit 
  // while files are being watched.
  if (options.watch === undefined)
    options.watch = false;

  config.env = nunjucks.configure(config.src, options);
  
  env = config.env;
  for (name in filters)
    env.addFilter(name, filters[name]);
}

function configureVerbosity(config, options) {
  config.verbose = options.verbose || config.verbose;
  config.vlog = config.verbose ? log : returnGulpUtil;
  delete options.verbose;
}

function createError(message, opt) {
  return new gutil.PluginError(PLUGIN_NAME, message, opt);
}

function log(message) {
  return gutil.log.apply(gutil, arguments);
}

function plugin(options) {
  var config = configure(options);

  function render(file, enc, cb) {
    var context = lodash.cloneDeep(config.context);
    var env = config.env;
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.data)
      lodash.assign(context, file.data);
    if (file.isStream()) {
      this.emit('error', createError('Streaming not supported'));
      return cb();
    }
    config.vlog('Rendering nunjucks file.path:', file.path);
    env.render(file.path, context, function(err, result) {
      if (err) {
        _this.emit('error', createError(err));
      }
      file.contents = new Buffer(result);
      file.path = gutil.replaceExtension(file.path, config.extension);
      _this.push(file);
      cb();
    });
  }
  return through.obj(render);
}
module.exports = plugin;
plugin.nunjucks = nunjucks;

function returnGulpUtil() {
  return gutil;
}
