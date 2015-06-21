'use strict';

var gutil = require('gulp-util');
var lodash = require('lodash');
var nunjucks = require('nunjucks');
var through = require('through2');

var DEFAULT_FILE_EXTENSION = '.html';

function configure(options) {
  var config = {
    context: {},
    extension: DEFAULT_FILE_EXTENSION,
    verbose: false
  };
  var data, env, g, name;

  options = options || {};
  options = lodash.cloneDeep(options);
  
  if (options.verbose === true)
    config.verbose = true;
  if (options.extension) {
    config.extension = options.extension;
    delete options.extension;
  }
  if (options.src) {
    config.src = options.src;
    delete options.src;
  }
  if (options.data) {
    lodash.assign(config.context, options.data);
    delete options.data;
  }
  if (options.globals) {
    g = options.globals;
    delete options.globals;
    if (g !== undefined)
      lodash.assign(config.context, g.functions);
  }
  if (options.watch === undefined)
    options.watch = false;
  env = config.env = nunjucks.configure(config.src, options);
  
  if (g !== undefined && g.filters !== undefined)
    for (name in g.filters)
      env.addFilter(name, g.filters[name]);
  
  return config;
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
      this.emit('error', new gutil.PluginError('gulp-nunjucks-api', 'Streaming not supported'));
      return cb();
    }
    if (config.verbose === true) {
      console.log('gulp-nunjucks-api rendering file.path: ' + file.path);
    }
    env.render(file.path, context, function(err, result) {
      if (err) {
        _this.emit('error', new gutil.PluginError('gulp-nunjucks-api', err));
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
