# gulp-nunjucks-api

> Render [Nunjucks](https://mozilla.github.io/nunjucks/) templates

*Issues with the output should be reported on the Nunjucks 
[issue tracker](https://github.com/mozilla/nunjucks/issues).*


## Install

Install with [npm](https://npmjs.org/package/gulp-nunjucks-api)

```
npm install --save-dev gulp-nunjucks-api
```

## Example

```js
var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-api');

gulp.task('default', function () {
  return gulp.src('src/templates/*.html')
		.pipe(nunjucksRender({
		  src: 'src/templates',
          data: require('./data.json'),
          globals: require('./global-custom-filters-and-context-functions.json')		  
		}))
		.pipe(gulp.dest('dist'));
});
```

*Note: To keep Nunjucks render from eating up all your ram, make sure to 
specify the `src` path(s) option. This will also allow you to define your paths
relatively.*

## Example with gulp data

```js
var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-api');
var data = require('gulp-data');

function getDataForFile(file){
  return {
    example: 'data loaded for ' + file.relative
  };
}

gulp.task('default', function () {
	return gulp.src('src/templates/*.html')
	  .pipe(data(getDataForFile))
		.pipe(nunjucksRender({
      src: ['src/templates/']
    }))
		.pipe(gulp.dest('dist'));
});
```


## API

### nunjucks-render(options)

Same options as [`nunjucks.configure()`](http://mozilla.github.io/nunjucks/api.html#configure):

- *watch* _(default: false)_ reload templates when they are changed.
- *express* an express app that nunjucks should install to.
- *autoescape* _(default: false)_ controls if output with dangerous characters are escaped automatically.
- *tags*: _(default: see nunjucks syntax)_ defines the syntax for nunjucks tags.

With the following additional options:

- *extension* _(default: ".html")_ String. File extension to output.
- *src* _(default: undefined)_ String or Array. Source path(s) being configured.
- *data* _(default: {})_ Ojbect. Context data available to all templates.
- *globals* _(default: undefined)_ Object. Provides `filters` and `functions` 
properties, which are are added to the nunjucks environment or context.

For example
```
nunjucksRender({
  data: {css_path: 'http://company.com/css/'}
});
```

For the following template
```
<link rel="stylesheet" href="{{ css_path }}test.css" />
```

Would render
```
<link rel="stylesheet" href="http://company.com/css/test.css" />
```

### Watch mode
Nunjucks' watch feature, which is normally enabled by default, is disabled by
default in this plugin. Pass `watch: true` to enable it:

```
nunjucksRender({
  src: './source',
  watch: true
});
```

## License

MIT © [Devoptix LLC](http://www.devoptix.com)

## Shout-outs

[Carlos G. Limardo](http://limardo.org) who wrote 
[gulp-nunjucks-render](https://www.npmjs.com/package/gulp-nunjucks-render) 
which I am forking in order to update Nunjucks and do other stuff.

[Sindre Sorhus](http://sindresorhus.com/) who wrote the original 
[gulp-nunjucks](https://www.npmjs.org/package/gulp-nunjucks) for precompiling 
Nunjucks templates. I updated his to render instead of precompile.
