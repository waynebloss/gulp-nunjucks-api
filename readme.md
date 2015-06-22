# gulp-nunjucks-api

> Render [Nunjucks](https://mozilla.github.io/nunjucks/) templates with data, 
custom filters, custom context functions and options for other Nunjucks API 
features.

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
      data: require('./global-data.json'),
      filters: require('./global-filters.js'),
      functions: require('./global-functions.js')
		}))
		.pipe(gulp.dest('dist'));
});
```

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
      src: 'src/templates/'
    }))
		.pipe(gulp.dest('dist'));
});
```


## API

### nunjucks-render(options)

Same options as 
[`nunjucks.configure()`](http://mozilla.github.io/nunjucks/api.html#configure):

- **watch** _(default: false)_ reload templates when they are changed.
- **express** an express app that nunjucks should install to.
- **autoescape** _(default: false)_ controls if output with dangerous 
characters are escaped automatically. See 
[Autoescaping](http://mozilla.github.io/nunjucks/api.html#autoescaping).
- **tags** _(default: see nunjucks syntax)_ defines the syntax for nunjucks 
tags. See 
[Customizing Syntax](http://mozilla.github.io/nunjucks/api.html#customizing-syntax).

With the following additional options:

- **extension** _(default: ".html")_ String. File extension to output.
- **src** _(default: undefined)_ String or Array. Search path(s) for 
`nunjucks.configure()`.
- **data** _(default: {})_ Ojbect. Global data merged into the Nunjucks render 
context.
- **extensions** _(default: {})_ Object. Global extensions added to the 
Nunjucks environment. See 
[Custom Tags](http://mozilla.github.io/nunjucks/api.html#custom-tags).
- **filters** _(default: {})_ Object. Global filter functions added to the 
Nunjucks environment. See 
[Custom Filters](http://mozilla.github.io/nunjucks/api.html#custom-filters).
- **functions** _(default: {})_ Object. Global functions merged into the 
Nunjucks render context.
- **globals** _(default: undefined)_ Object. A single object which provides 
`data`, `extensions`, `filters` and `functions` objects instead of setting 
each of these options separately. The separate global options are merged into 

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
default for gulp. Pass `watch: true` to enable it:

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
Nunjucks templates.
