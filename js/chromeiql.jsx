import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import _ from 'lodash';
import $ from 'jquery';

// Buffer for endpoint entry value
let chromeiqlEndpoint;

// Buffer for headers value
let chromeiqlHeaders;

// Parse the search string to get url parameters.
const search = window.location.search;
let parameters = {};
search.substr(1).split('&').forEach(function (entry) {
  const eq = entry.indexOf('=');
  if (eq >= 0) {
    parameters[decodeURIComponent(entry.slice(0, eq))] =
      decodeURIComponent(entry.slice(eq + 1));
  }
});

// if variables was provided, try to format it.
if (parameters.variables) {
  try {
    parameters.variables =
      JSON.stringify(JSON.parse(parameters.variables), null, 2);
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function updateURL() {
  let newSearch = '?' + Object.keys(parameters).map(function (key) {
    return encodeURIComponent(key) + '=' +
      encodeURIComponent(parameters[key]);
  }).join('&');
  history.replaceState(null, null, newSearch);
}

function createHeaders(headers) {
  const retHeaders = new Headers({'Content-Type': 'application/json'});
  if (headers) {
    let hconv = string2Header(headers);
    for (let header of hconv) {
      if (header.length !== 2) continue;
      retHeaders.append(header[0], header[1]);
    }
  }
  return retHeaders;
}

const headers2String = (headers) => {
  if (headers) {
    let headerStr = '';
    for(let header of headers.entries()) {
      headerStr += `${header[0]}:${header[1]};`
    }
    return headerStr;
  }
}

const string2Header = (str) => {
  if (str && typeof str === 'string') {
    let headers = str.split(';').filter(h => h !== '').reduce((ph, ch, ci) => {
      const values = ch.split(':');
      ph.append(values[0], values[1]);
      return ph;
    }, new Headers());
    return headers;
  }
}

// Defines a GraphQL fetcher using the fetch API.
function graphQLFetcher(endpoint, headers = null) {
  return function(graphQLParams) {
    return fetch(endpoint, {
      method: 'post',
      headers: headers ? createHeaders(headers) : { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    }).then(response => response.json());
  }
}

class ChromeiQL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      prevEndpoint: null,
      currEndpoint: this.props.endpoint,
      prevHeaders: null,
      currHeaders: this.props.headers,
    };

    this.setEndpoint = this.setEndpoint.bind(this)
    this.updateEndpoint = this.updateEndpoint.bind(this)
    this.setHeaders = this.setHeaders.bind(this)
    this.updateHeaders = this.updateHeaders.bind(this)
  }

  render() {
    const endpoint = this.state.currEndpoint
    const headers = this.state.currHeaders
    let graphqlConsole = null;
    if (endpoint) {
      
      graphqlConsole =
        <GraphiQL
          id = "graphiql"
          fetcher = {graphQLFetcher(endpoint, headers)}
          query = {parameters.query}
          variables = {parameters.variables}
          onEditQuery = {onEditQuery}
          onEditVariables = {onEditVariables} />;
    }
    // If we have changed endpoints just now...
    if (this.state.currEndpoint !== this.state.prevEndpoint) {
      // then we shall re-execute the query after render
      setTimeout(() => $('button.execute-button').click(), 500);
    }
    // If we have changed endpoints just now...
    if (this.state.currHeaders !== this.state.prevHeaders) {
      // then we shall re-execute the query after render
      setTimeout(() => $('button.execute-button').click(), 500);
    }

    return (
      <div id = "application">
        <div id="input-bar" className="graphiql-container" >
          <input type="text" id="url-box" defaultValue={endpoint} onChange={this.updateEndpoint} />
          <a id="url-save-button" className="toolbar-button" onClick={this.setEndpoint}>
            Set endpoint
          </a>
          <input type="text" id="headers-box" defaultValue={headers} onChange={this.updateHeaders} />
          <a id="headers-save-button" className="toolbar-button" onClick={this.setHeaders}>
            Set headers
          </a>
        </div>
        { graphqlConsole }
      </div>
    );
  }

  setEndpoint() {
    const newEndpoint = chromeiqlEndpoint;
    const setState = this.setState.bind(this);
    const currState = this.state;

    chrome.storage.local.set(
      { "chromeiqlEndpoint": newEndpoint },
      () => {
        if (!chrome.runtime.lastError) {
          // Move current endpoint to previous, and set current endpoint to new.
          setState({
            prevEndpoint: currState.currEndpoint,
            currEndpoint: newEndpoint
          });
        }
      }
    );
  }

  updateEndpoint(e) {
    chromeiqlEndpoint = e.target.value;
  }

  setHeaders() {
    const newHeaders = chromeiqlHeaders;
    const setState = this.setState.bind(this);
    const currState = this.state;
    console.log('setHeaders state', currState);
    console.log('setHeaders headers', newHeaders);
    chrome.storage.local.set(
      { "chromeiqlHeaders": newHeaders },
      () => {
        if (!chrome.runtime.lastError) {
          // Move current endpoint to previous, and set current endpoint to new.
          setState({
            prevHeaders: currState.currHeaders,
            currHeaders: newHeaders
          });
        }
      }
    );
  }

  updateHeaders(e) {
    chromeiqlHeaders = e.target.value;
  }
}


chrome.storage.local.get(["chromeiqlEndpoint", "chromeiqlHeaders"], (storage) =>
  // Render <GraphiQL /> into the body.
  ReactDOM.render(
    <ChromeiQL endpoint={storage.chromeiqlEndpoint} headers={storage.chromeiqlHeaders} />,
    document.body
  )
);
