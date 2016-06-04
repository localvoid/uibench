import React from 'react';
import ReactDOM from 'react-dom';
import URI from 'URIjs';
import d3 from 'd3';
import {LchColor, lchToRgb, formatRgbToHex} from 'inkdrop';

function stdev(items) {
  const m = d3.mean(items);

  const variance = d3.mean(items.map((i) => {
    const diff = i - m;
    return diff * diff;
  }));

  return Math.sqrt(variance);
}

function Report(name, version, samples) {
  this.name = name;
  this.version = version;
  this.samples = samples;
}

class Results {
  constructor() {
    this.reports = [];
    this.sampleNames = [];
    this.sampleNamesIndex = {};
  }

  update(name, version, samples) {
    this.reports.push(new Report(name, version, samples));

    const keys = Object.keys(samples);
    for (let i = 0; i < keys.length; i++) {
      const sampleName = keys[i];
      const v = this.sampleNamesIndex[sampleName];
      if (v === undefined) {
        this.sampleNamesIndex[sampleName] = this.sampleNames.length;
        this.sampleNames.push(sampleName);
      }
    }
  }
}

class Header extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }

  render() {
    return (
      <div className="jumbotron">
        <div className="container">
          <h1>UI Benchmark</h1>
          <p>To start benchmarking, click on the "Open" button below library name that you want to test, it will
            open a new window, perform tests and send results back to the main window, results will be displayed
            at the bottom section "Results".</p>
          <p>This benchmark measures how long it takes to perform update from one state to another, it doesn't
            measure how long will take paint/layout/composition phases, just js part.</p>
          <p>In the "Results" section there will be different test cases, for example test
            case <code>table/[100,4]/render</code> represents update from empty table to table with 100 rows and 4
            columns. Test case <code>table/[100,4]/filter/32</code> is an update from table with 100 rows and 4
            columns to the same table where each 32th item is removed. Details about all test cases can be found inside
            the <a href="https://github.com/localvoid/uibench-base/blob/master/lib/uibench.ts#L317">uibench.js</a> file.</p>
        </div>
      </div>
    );
  }
}

function _createQuery(opts) {
  const q = {
    report: true,
    i: opts.iterations,
  };
  if (opts.disableSCU) {
    q.disableSCU = true;
  }
  if (opts.enableDOMRecycling) {
    q.enableDOMRecycling = true;
  }
  if (opts.mobileMode) {
    q.mobile = true;
  }
  if (opts.testFilter) {
    q.filter = opts.testFilter;
  }

  return q;
}

class Contestant extends React.Component {
  constructor(props) {
    super(props);
    this.openWindow = this.openWindow.bind(this);
  }

  openWindow(e) {
    window.open(URI(this.props.benchmarkUrl).addQuery(_createQuery(this.props.opts)), '_blank');
  }

  render() {
    return (
      <div className="list-group-item">
        <h4 className="list-group-item-heading"><a href={this.props.url} target="_blank">{this.props.name}</a></h4>
        <p><small>{this.props.comments}</small></p>
        <div className="btn-group btn-group-xs">
          <button className="btn btn-default" onClick={this.openWindow}>Open</button>
        </div>
      </div>
    );
  }
}

class CustomContestant extends React.Component {
  constructor(props) {
    super(props);
    let url = localStorage['customURL'];
    if (url === void 0) {
      url = '';
    }
    this.state = {url: url};

    this.changeUrl = this.changeUrl.bind(this);
    this.openWindow = this.openWindow.bind(this);
  }

  changeUrl(e) {
    const v = e.target.value;
    localStorage['customURL'] = v;
    this.setState({url: v});
  }

  openWindow(e) {
    window.open(URI(this.state.url).addQuery(_createQuery(this.props.opts)), '_blank');
  }

  render() {
    return (
      <div key="custom_url" className="list-group-item">
        <h4 className="list-group-item-heading">Custom URL</h4>
        <div className="input-group">
          <input type="text" className="form-control" placeholder="http://www.example.com" value={this.state.url} onChange={this.changeUrl} />
          <span className="input-group-btn">
            <button className="btn btn-default" onClick={this.openWindow}>Open</button>
          </span>
        </div>
      </div>
    );
  }
}

class Contestants extends React.Component {
  render() {
    const props = this.props;
    return (
      <div className="list-group">
        {props.contestants.map((c) => <Contestant key={`${c.name}_${c.version}`} {...c} opts={props.opts} />)}
        <CustomContestant opts={props.opts} />
      </div>
    )
  }
}

class ResultsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: ''
    }
  }

  handleFilterChange(e) {
    this.setState({filter: e.target.value});
  }

  render() {
    const filter = this.state.filter || '';
    const results = this.props.results;
    const sampleNames = results.sampleNames;
    const reports = results.reports;

    if (reports.length === 0) {
      return (
        <div className="panel panel-default">
          <div className="panel-heading">Results (lower is better) </div>
          <div className="panel-body">Empty</div>
        </div>
      );
    }

    const titles = reports.map((r) => <th>{r.name} <small>{r.version}</small></th>);

    const rows = [];
    const overallTime = reports.map((r) => 0);

    for (let i = 0; i < sampleNames.length; i++) {
      const sampleName = sampleNames[i];
      if (sampleName.indexOf(filter) === -1) {
        continue;
      }

      const cols = [<td><code>{sampleName}</code></td>];

      const values = reports.map((r) => {
        const samples = r.samples[sampleName];

        return {
          sampleCount: samples.length,
          median: d3.median(samples),
          mean: d3.mean(samples),
          stdev: stdev(samples),
          min: d3.min(samples),
          max: d3.max(samples),
        };
      });

      const medianValues = values.map((v) => v.median);
      const medianMin = d3.min(medianValues);

      const scale = d3.scale.linear().domain([medianMin, d3.max(medianValues)]);

      for (let j = 0; j < reports.length; j++) {
        const report = reports[j];
        const value = values[j];
        const color = lchToRgb(new LchColor(0.9, 0.4, (30 + 110 * (1 - scale(value.median))) / 360));
        const style = {
          background: formatRgbToHex(color)
        };

        const title = `samples: ${value.sampleCount.toString()}\n` +
                      `median: ${Math.round(value.median * 1000).toString()}\n` +
                      `mean: ${Math.round(value.mean * 1000).toString()}\n` +
                      `stdev: ${Math.round(value.stdev * 1000).toString()}\n` +
                      `min: ${Math.round(value.min * 1000).toString()}\n` +
                      `max: ${Math.round(value.max * 1000).toString()}`;

        const percent = medianMin === value.median ?
          null :
          <small>{`(${(((value.median / medianMin) - 1) * 100).toFixed(2)}%)`}</small>;

        cols.push(<td title={title} style={style}>{Math.round(value.median * 1000) } {percent}</td>);

        overallTime[j] += Math.round(value.median * 1000);
      }

      rows.push(<tr>{cols}</tr>);
    }

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Results (lower is better)</div>
        <div className="panel-body">
          <h4>Flags:</h4>
          <ul>
            <li><strong>+r</strong> means that library is using DOM recycling, and instead of creating new DOM nodes
              on each update, it reuses them, so it breaks test cases like "render" and "insert".</li>
            <li><strong>+s</strong> means that library is using
              <code>shouldComponentUpdate</code> optimization.</li>
          </ul>
          <p>Don't use <u>Overall time</u> row to make any conclusions, like library X is N times faster than
            library Y. This row is used by library developers to easily check if there is some regression.</p>
          <div className="input-group">
            <span className="input-group-addon">Filter</span>
            <input type="text" className="form-control" placeholder="For example: render" value={filter} onChange={this.handleFilterChange.bind(this)} />
          </div>
          <table className="table table-condensed">
            <thead><tr><th key="empty"></th>{titles}</tr></thead>
            <tbody>
            <tr><td key="empty">Overall Time</td>{overallTime.map((t) => <td>{t}</td>)}</tr>
            {rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disableSCU: false,
      enableDOMRecycling: false,
      mobileMode: false,
      iterations: 3,
      filter: '',
    };

    this.onMobileModeChange = this.onMobileModeChange.bind(this);
    this.onDisableSCUChange = this.onDisableSCUChange.bind(this);
    this.onEnableDOMRecyclingChange = this.onEnableDOMRecyclingChange.bind(this);
    this.onIterationsChange = this.onIterationsChange.bind(this);
    this.onTestFilterChange = this.onTestFilterChange.bind(this);
  }

  onMobileModeChange(e) {
    this.setState({mobileMode: e.target.checked});
  }

  onDisableSCUChange(e) {
    this.setState({disableSCU: e.target.checked});
  }

  onEnableDOMRecyclingChange(e) {
    this.setState({enableDOMRecycling: e.target.checked});
  }

  onIterationsChange(e) {
    this.setState({iterations: e.target.value});
  }

  onTestFilterChange(e) {
    this.setState({testFilter: e.target.value});
  }

  render() {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="panel panel-default">
            <div className="panel-body">
              <div className="checkbox">
                <label>
                  <input type="checkbox" value={this.state.disableSCU} onChange={this.onDisableSCUChange} />
                  Disable <code>shouldComponentUpdate</code> optimization
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" value={this.state.enableDOMRecycling} onChange={this.onEnableDOMRecyclingChange} />
                  Enable DOM recycling (if implementation supports changing)
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" value={this.state.mobileMode} onChange={this.onMobileModeChange} />
                  Mobile mode
                </label>
              </div>
              <div className="form-group">
                <label for="iterations">Iterations</label>
                <input type="number" className="form-control" id="iterations" value={this.state.iterations} onChange={this.onIterationsChange} />
              </div>
              <div className="form-group">
                <label for="test-filter">Tests filter</label>
                <input type="text" className="form-control" id="test-filter" value={this.state.testFilter} placeholder="For example: render" onChange={this.onTestFilterChange} />
              </div>
            </div>
          </div>
          <Contestants contestants={this.props.contestants} opts={this.state} />
          <ResultsTable results={this.props.results} />
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', function(e) {
  const container = document.querySelector('#App');
  const state = {
    contestants: [
      {
        'name': 'React 0.14',
        'url': 'https://facebook.github.io/react/',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-react/',
        'comments': 'Virtual DOM.'
      },
      {
        'name': 'React 15',
        'url': 'https://facebook.github.io/react/',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-react-dev/',
        'comments': 'Virtual DOM. Compiled with: es2015-loose, transform-react-inline-elements.'
      },
      {
        'name': 'React 15 [Functional Components]',
        'url': 'https://facebook.github.io/react/',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-react-dev/fc.html',
        'comments': 'Virtual DOM. Benchmark implementation doesn\'t support sCU optimization. Compiled with: es2015-loose, transform-react-inline-elements.'
      },
      {
        'name': 'Bobril',
        'url': 'https://github.com/Bobris/Bobril',
        'benchmarkUrl': 'https://bobris.github.io/uibench-bobril/',
        'comments': 'Virtual DOM.'
      },
      {
        'name': 'Deku',
        'url': 'https://github.com/dekujs/deku',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-deku/',
        'comments': 'Virtual DOM.'
      },
      {
        'name': 'Mercury',
        'url': 'https://github.com/Raynos/mercury',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-mercury/',
        'comments': 'Virtual DOM (`virtual-dom` library).'
      },
      {
        'name': 'kivi [simple]',
        'url': 'https://github.com/localvoid/kivi',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-kivi/simple.html',
        'comments': 'Virtual DOM, simple benchmark implementation without any advanced optimizations.'
      },
      {
        'name': 'kivi [advanced]',
        'url': 'https://github.com/localvoid/kivi',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-kivi/advanced.html',
        'comments': 'Virtual DOM, benchmark implementation is using all optimizations that available in kivi API, except for DOM Nodes recycling.'
      },
      {
        'name': 'Preact',
        'url': 'https://github.com/developit/preact',
        'benchmarkUrl': 'https://developit.github.io/uibench-preact/',
        'comments': 'Virtual DOM. Using DOM Nodes recycling by default.'
      },
      {
        'name': 'React-lite',
        'url': 'https://github.com/Lucifier129/react-lite',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-react-lite/',
        'comments': 'Virtual DOM.'
      },
      {
        'name': 'Imba',
        'url': 'https://github.com/somebee/imba',
        'benchmarkUrl': 'https://somebee.github.io/uibench-imba/',
        'comments': 'Programming language with UI library that has Virtual DOM like API. Using DOM Nodes recycling by default.'
      },
      {
        'name': 'yo-yo',
        'url': 'https://github.com/maxogden/yo-yo',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-yo-yo/',
        'comments': 'Real DOM diff/patch (`morphdom` library). Benchmark implementation doesn\'t support sCU optimization (doesn\'t have components/thunks overhead).'
      },
      {
        'name': 'Snabbdom',
        'url': 'https://github.com/paldepind/snabbdom',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-snabbdom/',
        'comments': 'Virtual DOM.'
      },
      {
        'name': 'Maquette',
        'url': 'http://maquettejs.org/',
        'benchmarkUrl': 'https://localvoid.github.io/uibench-maquette/',
        'comments': 'Virtual DOM. Benchmark implementation doesn\'t support sCU optimization (doesn\'t have components/thunks overhead).'
      }
    ],
    results: new Results()
  };

  window.addEventListener('message', function(e) {
    const type = e.data.type;
    const data = e.data.data;

    if (type === 'report') {
      state.results.update(data.name, data.version, data.samples);
      ReactDOM.render(<Main {...state}/>, container);
    }
  });

  ReactDOM.render(<Main {...state}/>, container);
});
