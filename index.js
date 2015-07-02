'use strict';

var PLUGIN_NAME = 'gulp-nunjucks-api';

var glob = require('glob');
var gutil = require('gulp-util');
var lodash = require('lodash');
var nunjucks = require('nunjucks');
var path = require('path');
var requireNew = require('require-new');
var through = require('through2');

// #region Configuration

function configure(options) {
  var config = {
    context: {},
    extension: '.html',
    verbose: false,
    src: 'src',
    srcpath: path.resolve('src')
  };
  if (options === undefined || options === null)
    options = {};
  else
    options = lodash.cloneDeep(options);
  
  configureErrors(config, options);
  configureVerbosity(config, options);
  configureGlobals(config, options);
  configureLocals(config, options);
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

function configureErrors(config, options) {
  if ('errors' in options)
    config.errors = options.errors;
  else
    config.errors = true;
  delete options.errors;
}

function configureFiles(config, options) {
  if (options.extension)
    config.extension = options.extension;
  if (options.src) {
    config.src = options.src;
    config.srcpath = path.resolve(config.src);
  }
  delete options.extension;
  delete options.src;
}

function configureGlobals(config, options) {
  var g = {};
  var og = options.globals || {};
  g.data = lodash.merge({}, og.data, options.data);
  g.extensions = lodash.merge({}, og.extensions, options.extensions);
  g.filters = lodash.merge({}, og.filters, options.filters);
  g.functions = lodash.merge({}, og.functions, options.functions);
  config.g = g;
  delete options.data;
  delete options.extensions;
  delete options.filters;
  delete options.functions;
  delete options.globals;
}

function configureLocals(config, options) {
  if (options.locals === true)
    config.locals = '<filename>.+(js|json)';
  else
    config.locals = options.locals;
  delete options.locals;
}

function configureNunjucks(config, options) {
  var env;
  var g = config.g;
  var filters = g.filters;
  var extensions = g.extensions;
  var name;
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
  for (name in extensions)
    env.addExtension(name, extensions[name]);
}

function configureVerbosity(config, options) {
  config.verbose = options.verbose || config.verbose;
  config.vlog = config.verbose ? log : returnGulpUtil;
  delete options.verbose;
}

// #endregion

// #region Helpers

function createError(message, opt) {
  return new gutil.PluginError(PLUGIN_NAME, message, opt);
}

function handleError(config, sender, err, cb, opt) {
  config.vlog('Handling error: ' + err);
  var pluginErr = createError(err, opt);
  if (config.errors)
    sender.emit('error', pluginErr);
  return cb(pluginErr);
}

function log(message) {
  return gutil.log.apply(gutil, arguments);
}

function requireFile(config, filepath, result) {
  if (filepath === undefined || filepath === null)
    return false;
  try {
    result.obj = requireNew(filepath);
    return true;
  }
  catch (err) {
    config.vlog('File not found: ' + filepath);
  }
  return false;
}

// #endregion

function assignLocals(context, config, file) {
  var searchpath = path.dirname(file.path);
  var pfile = path.parse(file.path);
  var locals = String.prototype.replace.apply(config.locals, [
    '<filename>', pfile.base]);
  locals = String.prototype.replace.apply(locals, [
    '<filename_noext>', pfile.name]);
  var pattern = locals;
  config.vlog('Searching for locals with pattern:', pattern, 'in:', searchpath);
  var options = {
    cwd: searchpath,
    nodir: true,
    root: config.srcpath
  };
  var found = glob.sync(pattern, options);
  var i, fullpath, result;
  config.vlog('Found:', found.length, 'locals files.');
  for (i = 0; i < found.length; i++) {
    fullpath = path.resolve(searchpath, found[i]);
    config.vlog('Using locals file:', found[i], 'fullpath:', fullpath);
    result = {};
    if (requireFile(config, fullpath, result))
      lodash.assign(context, result.obj);
  }
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
    if (file.isStream())
      return handleError(config, _this, 'Streaming not supported', cb);
    if (file.data)
      lodash.assign(context, file.data);
    if (config.locals)
      assignLocals(context, config, file);
    config.vlog('Rendering nunjucks file.path:', file.path);
    env.render(file.path, context, function (err, result) {
      if (err)
        return handleError(config, _this, err, cb);
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
