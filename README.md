# UI Benchmark

[Open](https://localvoid.github.io/uibench/)

## Reports

- [Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2837.0 Safari/537.36](https://cdn.rawgit.com/localvoid/6715c4b23eadc460112e671b4add3710/raw/907901966dd0473f1026d1ff25e244a022eb5ab1/uibench_results.html)

## Benchmark implementations query parameters

### i

Number of iterations. Default: `10`.

`http://localhost:8000/?i=5`

### name

Override name.

`http://localhost:8000/?name=Test`

### version

Override version.

`http://localhost:8000/?version=0.0.1-a`

### report

Push report to the parent window. Default: `false`.

`http://localhost:8000/?report=true`

### mobile

Reduce number of DOM elements in tests. Default: `false`.

`http://localhost:8000/?mobile=true`

### enableDOMRecycling

Enable DOM recycling for implementations that support enabling/disabling DOM recycling. Default: `false`.

`http://localhost:8000/?enableDOMRecycling=true`

### filter

Filter tests by name (regexp).

`http://localhost:8000/?filter=render`

### fullRenderTime

Measure full render time (recalc style/layout/paint/composition/etc). Default: `false`.

`http://localhost:8000/?fullRenderTime=true`

### timelineMarks

Add marks to the Dev Tools timeline. Default: `false`.

`http://localhost:8000/?timelineMarks=true`

### disableChecks

Disable internal tests. Useful for experimenting with DOM structure changes. Default: `false`.

`http://localhost:8000/?disableChecks=true`

### startDelay

Add delay in ms before starting tests. Default: `0`.

`http://localhost:8000/?startDelay=3000`
