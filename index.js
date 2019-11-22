'use strict';

var PLUGIN_NAME = 'gulp-nunjucks-api';

var glob = require('glob');
var assign = require('lodash/assign');
var cloneDeep = require('lodash/cloneDeep');
var merge = require('lodash/merge');
var nunjucks = require('nunjucks');
var path = require('path');
var pluginError = require('plugin-error');
var requireNew = require('require-new');
var through = require('through2');
var fancyLog = require('fancy-log');
var replaceExt = require('replace-ext');

// #region Configuration

function
configure(options) {

  var config = {
    context: {},
    extension: '.html',
    renderString: false,
    piping: true
  };
  if (options === undefined || options === null)
    options = {};
  else
    options = cloneDeep(options);

  configureErrors(config, options);
  configureGlobals(config, options);
  configureLocals(config, options);
  configureContext(config, options);
  configureFiles(config, options);
  configureNunjucks(config, options);
  configurePluginOptions(config, options);

  return config;
}

function configureContext(config, options) {
  var g = config.g;
  assign(config.context, g.functions);
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
  if (options.src)
    config.src = options.src;
  delete options.extension;
  delete options.src;
}

function configureGlobals(config, options) {
  var g = {};
  var og = options.globals || {};
  g.extensions = merge({}, og.extensions, options.extensions);
  g.filters = merge({}, og.filters, options.filters);
  g.functions = merge({}, og.functions, options.functions);

  config.g = g;
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
  for (var property in options.data) {
    if (options.data.hasOwnProperty(property)) {
      config.env.addGlobal(property, options.data[property]);
    }
  }


  env = config.env;
  for (name in filters)
    env.addFilter(name, filters[name]);
  for (name in extensions)
    env.addExtension(name, extensions[name]);

}

function configurePluginOptions(config, options) {
  config.renderString = options.renderString || config.renderString;
  config.piping = config.piping;

  if (typeof options.piping !== 'undefined') {
    config.piping = options.piping;
  } else {
    config.piping = config.piping;
  }
  delete options.renderString;
  delete options.piping;
}

// #endregion

// #region Helpers

function createError(message, opt) {
  return new pluginError(PLUGIN_NAME, message, opt);
}

function handleError(config, sender, err, cb, opt) {
  fancyLog.info('Handling error: ' + err);
  var pluginErr = createError(err, opt);
  if (config.errors)
    sender.emit('error', pluginErr);
  return cb(pluginErr);
}

function log(message) {
  fancyLog(message);
}

function requireFile(config, filepath, result) {
  if (filepath === undefined || filepath === null)
    return false;
  try {
    result.obj = requireNew(filepath);
    return true;
  }
  catch (err) {
    fancyLog.error('File not found: ' + filepath);
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
  fancyLog.info('Searching for locals with pattern:', pattern, 'in:', searchpath);
  var options = {
    cwd: searchpath,
    nodir: true
  };
  var found = glob.sync(pattern, options);
  var i, fullpath, result;
  fancyLog.info('Found:', found.length, 'locals files.');
  for (i = 0; i < found.length; i++) {
    fullpath = path.resolve(searchpath, found[i]);
    fancyLog.info('Using locals file:', found[i], 'fullpath:', fullpath);
    result = {};
    if (requireFile(config, fullpath, result))
      assign(context, result.obj);
  }
}

function plugin(options) {
  var config = configure(options);


  function render(file, enc, cb) {
    var context = cloneDeep(config.context);
    var env = config.env;
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream())
      return handleError(config, _this, 'Streaming not supported', cb);
    if (file.data)
      assign(context, file.data);
    if (config.locals)
      assignLocals(context, config, file);
    fancyLog.info('Rendering nunjucks file.path:', file.path);

    if (config.renderString) {
      env.renderString(file.contents.toString(), context, function(err, result) {
        if (err)
          return handleError(config, _this, err, cb);
        file.contents = new Buffer(result);
        if (config.extension !== 'inherit')
          file.path = replaceExt(file.path, config.extension);
        _this.push(file);
        cb();
      });
    } else {
      env.render(file.path, context, function (err, result) {
        if (err)
          return handleError(config, _this, err, cb);
        file.contents = new Buffer(result);
        if (config.extension !== 'inherit')
          file.path = replaceExt(file.path, config.extension);
        _this.push(file);
        cb();
      });
    }
  }

  if (config.piping) {
    return through.obj(render);
  } else {
    // For cases where we don't want to use this in with gulp
    // pipes and instead have a way to render nunjucks-style
    // strings with all the options set.
    return function(contents, data, cb) {
      var context = cloneDeep(config.context);
      var env = config.env;

      if (data) {
        assign(context, data);
      };

      env.renderString(contents, context, cb);
    }
  }
}
module.exports = plugin;
plugin.nunjucks = nunjucks;
