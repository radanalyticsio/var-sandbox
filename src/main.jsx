var React = require('react');
var ReactDOM = require('react-dom');
var Request = require('superagent');


class StocksList extends React.Component {
  render() {
    return (
      <ul>
        {this.props.stocks.map(stock => (
          <li key={stock.symbol}>{stock.symbol}: {stock.quantity}</li>
        ))}
      </ul>
    );
  }
}


class PredictionResults extends React.Component {
  render() {
    return (
      <ul>
        {this.props.results.map(result => (
          <li key={result.id}>
            <ul>
              <li>status: {result.status}</li>
              <li>days of simulation: {result.days}</li>
              <li>number of simulations: {result.simulations}</li>
              {result.stocks.map(stock => (
                <li key={stock.symbol}>{stock.symbol} {stock.quantity} shares</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }
}


class VaRErrors extends React.Component {
  render() {
    return (
      <div id="errors">
        <ul>
        {this.props.errors.map(error => (
          <li key={error}>Error: {error}</li>
        ))}
        </ul>
      </div>
    );
  }
}


class VaRApp extends React.Component {
  constructor(props) {
    super(props);
    this.handleAddSymbol = this.handleAddSymbol.bind(this);
    this.handleSymbolChange = this.handleSymbolChange.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleDaysChange = this.handleDaysChange.bind(this);
    this.handleSimsChange = this.handleSimsChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      stocks: [],
      days: 0,
      simulations: 0,
      currentSymbol: '',
      currentQuantity: 0,
      errors: [],
      predictions: []
    };
  }

  render() {
    return (
      <div>
        <div>
          <VaRErrors errors={this.state.errors} />
          <h1>Enter stocks to predict</h1>
          Stock Symbol:
          <input onChange={this.handleSymbolChange} value={this.state.currentSymbol} />
          Quantity:
          <input onChange={this.handleQuantityChange} value={this.state.currentQuantity} />
          <button onClick={this.handleAddSymbol}>Add</button>
          <StocksList stocks={this.state.stocks} />
          Number of days to simulate:
          <input type="text" onChange={this.handleDaysChange} value={this.state.days} /><br />
          Number of simulations to run:
          <input type="text" onChange={this.handleSimsChange} value={this.state.simulations} /><br />
          <button onClick={this.handleSubmit}>Submit</button>
          <button onClick={this.handleReset}>Reset</button>
        </div>
        <div>
        <h1>Results</h1>
        <PredictionResults results={this.state.predictions} />
        </div>
        </div>
    );
  }

  handleSymbolChange(e) {
    this.setState({currentSymbol: e.target.value});
  }

  handleQuantityChange(e) {
    var newval = Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value);
    this.setState({currentQuantity: newval});
  }

  handleDaysChange(e) {
    var newval = Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value);
    this.setState({days: newval});
  }

  handleSimsChange(e) {
    var newval = Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value);
    this.setState({simulations: newval});
  }

  handleAddSymbol(e) {
    var errors = [];
    if (this.state.currentSymbol === '') {
      errors = errors.concat("empty symbol");
    }
    if (this.state.currentQuantity === 0) {
      errors = errors.concat("zero quantity requested");
    }
    if (errors.length > 0) {
      this.setState((prevState) => ({
        errors: prevState.errors.concat(errors)
      }));
      return;
    }
    var newStock = {
      symbol: this.state.currentSymbol,
      quantity: this.state.currentQuantity
    };
    this.setState((prevState) => ({
      stocks: prevState.stocks.concat(newStock),
      currentSymbol: '',
      currentQuantity: 0,
      errors: []
    }));
  }

  handleReset() {
    this.setState({
      stocks: [],
      days: 0,
      simulations: 0,
      currentSymbol: '',
      currentQuantity: 0,
      errors: []
    });
  }

  handleSubmit() {
    var errors = [];
    if (this.state.days === 0) {
      errors = errors.concat("zero days requested");
    }
    if (this.state.simulations === 0) {
      errors = errors.concat("zero simulations requested");
    }
    if (this.state.stocks.length === 0) {
      errors = errors.concat("no stocks requested");
    }
    if (errors.length > 0) {
      this.setState((prevState) => ({
        errors: prevState.errors.concat(errors)
      }));
      return;
    }
    var pdata = {
      stocks: this.state.stocks,
      days: this.state.days,
      simulations: this.state.simulations
    };
    Request
      .post('/predictions')
      .send(pdata)
      .end((err, res) => {
        if (err || !res.ok) {
          this.setState((prevState) => ({
            errors: prevState.errors.concat("server error")
          }));
        } else {
          this.setState((prevState) => ({
            predictions: prevState.predictions.concat(res.body)
          }));
          this.handleReset()
        }
      });
  }
}


ReactDOM.render(
  <VaRApp />,
  document.getElementById('root')
);
