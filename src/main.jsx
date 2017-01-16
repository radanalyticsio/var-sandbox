var React = require('react');
var ReactDOM = require('react-dom');

class VaRApp extends React.Component {
  render() {
    return (
      <div>
        <div>
          <h1>Enter stock tickers to predict</h1>
          <input type="text"></input>
          <button>Add</button><br />
          <button>Submit</button>
        </div>
        <div>
          <h1>Results</h1>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <VaRApp />,
  document.getElementById('root')
);
