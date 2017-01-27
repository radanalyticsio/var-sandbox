var React = require('react');
var ReactDOM = require('react-dom');
var Request = require('superagent');
var Io = require('socket.io-client');


class DaysInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    const value = this.props.value;
    return (
      <div className="form-group">
        <label className="col-sm-2 control-label" htmlFor="days-input">Days</label>
        <div className="col-sm-10">
          <input id="days-input" type="text" onChange={this.handleChange} value={value} />
        </div>
      </div>
    );
  }

  handleChange(e) {
    var newval = Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value);
    this.props.onChange(newval);
  }
}


class SimulationsInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    const value = this.props.value;
    return (
      <div className="form-group">
        <label className="col-sm-2 control-label" htmlFor="sims-input">Simulations</label>
        <div className="col-sm-10">
          <input id="sims-input" type="text" onChange={this.handleChange} value={value} />
        </div>
      </div>
    );
  }

  handleChange(e) {
    var newval = Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value);
    this.props.onChange(newval);
  }
}


class StockSymbolInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleSymbolChange = this.handleSymbolChange.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.state = {
      symbol: '',
      quantity: 0
    };
  }

  render() {
    return (
      <div>
        <div className="form-group">
          <label className="col-sm-2 control-label" htmlFor="stock-symbol">Symbol</label>
          <div className="col-sm-10">
            <input id="stock-symbol" type="text" onChange={this.handleSymbolChange} value={this.state.symbol} />
          </div>
        </div>
        <div className="form-group">
          <label className="col-sm-2 control-label" htmlFor="stock-quantity">Quantity</label>
          <div className="col-sm-10">
            <input id="stock-quantity" type="text" onChange={this.handleQuantityChange} value={this.state.quantity} />
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button type="button" className="btn btn-primary" onClick={this.handleAdd}>Add</button><br />
          </div>
        </div>
      </div>
    );
  }

  handleSymbolChange(e) {
    this.setState({symbol: e.target.value});
  }

  handleQuantityChange(e) {
    this.setState({quantity: e.target.value});
  }

  handleAdd() {
    var newStock = {
      symbol: this.state.symbol.toUpperCase(),
      quantity: this.state.quantity
    };
    this.props.onAddSymbol(newStock);
    this.setState({symbol: '', quantity: 0});
  }
}


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
              {result.prediction !== undefined &&
                <li>results:
                  <ul>
                    {result.prediction.map(pred => (<li key={pred}>{pred}</li>))}
                  </ul>
                </li>
              }
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
    this.handleReset = this.handleReset.bind(this);
    this.handleDaysChange = this.handleDaysChange.bind(this);
    this.handleSimsChange = this.handleSimsChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePredictionUpdate = this.handlePredictionUpdate.bind(this);
    this.state = {
      stocks: [],
      days: 0,
      simulations: 0,
      errors: [],
      predictions: []
    };
    var wsuri = "ws://" + window.location.host;
    console.log(wsuri);
    var socket = Io(wsuri);
    socket.on('connect', () => { console.log("websocket connected"); });
    socket.on('update', this.handlePredictionUpdate);
  }

  render() {
    return (
      <div>
        <div>
          <VaRErrors errors={this.state.errors} />
          <form className="form-horizontal">
            <div className="row">
              <h1>Enter stocks in portfolio</h1>
              <div className="col-sm-5">
                <StockSymbolInput onAddSymbol={this.handleAddSymbol} />
              </div>
              <div className="col-sm-2">
                <StocksList stocks={this.state.stocks} />
              </div>
            </div>
            <div className="row">
              <h1>Enter simulation constraints</h1>
              <div className="col-sm-5">
                <DaysInput onChange={this.handleDaysChange} value={this.state.days} />
                <SimulationsInput onChange={this.handleSimsChange} value={this.state.simulations} />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-offset-1 col-sm-11">
                <div className="form-group">
                  <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>Submit</button>
                  <button type="button" className="btn btn-default" onClick={this.handleReset}>Reset</button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="row">
          <h1>Results</h1>
          <PredictionResults results={this.state.predictions} />
        </div>
      </div>
    );
  }

  handlePredictionUpdate(d) {
    var data = JSON.parse(d);
    var updates = this.state.predictions.map((item) => {
      return item.id === data.id ? data : item;
    });
    this.setState({predictions: updates});
  }

  handleDaysChange(v) {
    this.setState({days: v});
  }

  handleSimsChange(v) {
    this.setState({simulations: v});
  }

  handleAddSymbol(s) {
    var errors = [];
    if (s.symbol === '') {
      errors = errors.concat("empty symbol");
    }
    if (s.quantity === 0) {
      errors = errors.concat("zero quantity requested");
    }
    if (errors.length > 0) {
      this.setState((prevState) => ({
        errors: prevState.errors.concat(errors)
      }));
      return;
    }
    this.setState((prevState) => ({
      stocks: prevState.stocks.concat(s),
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
