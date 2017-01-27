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
        {this.props.errors.map(error => (
          <div className="alert alert-danger">
            <span className="pficon pficon-error-circle-o"></span>
            <strong>Error:</strong> {error}
          </div>
        ))}
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
    if (StockSymbolList.indexOf(s.symbol) === -1) {
      errors = errors.concat("unknown symbol");
    }
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
    } else {
      this.setState((prevState) => ({
        stocks: prevState.stocks.concat(s),
        currentSymbol: '',
        currentQuantity: 0,
        errors: []
      }));
    }
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

const StockSymbolList = ["A", "AA", "AAL", "AAMC", "AAN", "AAOI", "AAON", "AAP", "AAPL", "AAT", "AAWW", "ABAX", "ABBV", "ABC", "ABCB", "ABCO", "ABFS", "ABG", "ABM", "ABMD", "ABT", "ACAD", "ACAS", "ACAT", "ACC", "ACCL", "ACCO", "ACE", "ACET", "ACFN", "ACGL", "ACHC", "ACHN", "ACI", "ACIW", "ACLS", "ACM", "ACN", "ACO", "ACOR", "ACRE", "ACRX", "ACTG", "ACW", "ACXM", "ADBE", "ADC", "ADES", "ADI", "ADM", "ADMS", "ADNC", "ADP", "ADS", "ADSK", "ADT", "ADTN", "ADUS", "ADVS", "AE", "AEC", "AEE", "AEGN", "AEGR", "AEIS", "AEL", "AEO", "AEP", "AEPI", "AERI", "AES", "AET", "AF", "AFAM", "AFFX", "AFG", "AFH", "AFL", "AFOP", "AFSI", "AGCO", "AGEN", "AGII", "AGIO", "AGM", "AGN", "AGNC", "AGO", "AGTC", "AGX", "AGYS", "AHC", "AHH", "AHL", "AHP", "AHS", "AHT", "AI", "AIG", "AIMC", "AIN", "AINV", "AIQ", "AIR", "AIRM", "AIT", "AIV", "AIZ", "AJG", "AKAM", "AKAO", "AKBA", "AKR", "AKRX", "AKS", "AL", "ALB", "ALCO", "ALDR", "ALE", "ALEX", "ALG", "ALGN", "ALGT", "ALIM", "ALJ", "ALK", "ALKS", "ALL", "ALLE", "ALNY", "ALOG", "ALR", "ALSN", "ALTR", "ALX", "ALXN", "AMAG", "AMAT", "AMBA", "AMBC", "AMBR", "AMC", "AMCC", "AMCX", "AMD", "AME", "AMED", "AMG", "AMGN", "AMKR", "AMNB", "AMP", "AMPE", "AMRC", "AMRE", "AMRI", "AMRS", "AMSC", "AMSF", "AMSG", "AMSWA", "AMT", "AMTD", "AMTG", "AMWD", "AMZG", "AMZN", "AN", "ANAC", "ANAD", "ANAT", "ANCX", "ANDE", "ANF", "ANGI", "ANGO", "ANH", "ANIK", "ANIP", "ANN", "ANR", "ANSS", "ANTM", "ANV", "AOI", "AOL", "AON", "AOS", "AOSL", "AP", "APA", "APAGF", "APAM", "APC", "APD", "APEI", "APH", "APL", "APOG", "APOL", "APP", "ARAY", "ARC", "ARCB", "ARCC", "ARCW", "ARE", "AREX", "ARG", "ARI", "ARIA", "ARII", "ARNA", "ARNC", "ARO", "AROW", "ARPI", "ARQL", "ARR", "ARRS", "ARRY", "ARSD", "ARTC", "ARTNA", "ARUN", "ARW", "ARWR", "ARX", "ASBC", "ASC", "ASCMA", "ASEI", "ASGN", "ASH", "ASNA", "ASPS", "ASPX", "ASTE", "AT", "ATEC", "ATEN", "ATHN", "ATI", "ATK", "ATLO", "ATMI", "ATML", "ATNI", "ATNM", "ATNY", "ATO", "ATR", "ATRC", "ATRI", "ATRO", "ATRS", "ATSG", "ATU", "ATVI", "ATW", "AUXL", "AVA", "AVAV", "AVB", "AVD", "AVEO", "AVG", "AVGO", "AVHI", "AVID", "AVIV", "AVNR", "AVNW", "AVP", "AVT", "AVX", "AVY", "AWAY", "AWH", "AWI", "AWK", "AWR", "AXAS", "AXDX", "AXE", "AXL", "AXLL", "AXP", "AXS", "AYI", "AYR", "AZO", "AZPN", "AZZ", "B", "BA", "BABY", "BAC", "BAGL", "BAGR", "BAH", "BALT", "BANC", "BANF", "BANR", "BAS", "BAX", "BBBY", "BBCN", "BBG", "BBGI", "BBNK", "BBOX", "BBRG", "BBSI", "BBT", "BBW", "BBX", "BBY", "BC", "BCC", "BCEI", "BCO", "BCOR", "BCOV", "BCPC", "BCR", "BCRX", "BDBD", "BDC", "BDE", "BDGE", "BDN", "BDSI", "BDX", "BEAM", "BEAT", "BEAV", "BEBE", "BECN", "BEE", "BELFB", "BEN", "BERY", "BFAM", "BFIN", "BFS", "BF_B", "BG", "BGC", "BGCP", "BGFV", "BGG", "BGS", "BH", "BHB", "BHE", "BHI", "BHLB", "BID", "BIDU", "BIG", "BIIB", "BIO", "BIOL", "BIOS", "BIRT", "BJRI", "BK", "BKCC", "BKD", "BKE", "BKH", "BKMU", "BKS", "BKU", "BKW", "BKYF", "BLDR", "BLK", "BLKB", "BLL", "BLMN", "BLOX", "BLT", "BLUE", "BLX", "BMI", "BMR", "BMRC", "BMRN", "BMS", "BMTC", "BMY", "BNCL", "BNCN", "BNFT", "BNNY", "BOBE", "BODY", "BOFI", "BOH", "BOKF", "BOLT", "BONT", "BOOM", "BP", "BPFH", "BPI", "BPOP", "BPTH", "BPZ", "BR", "BRC", "BRCD", "BRCM", "BRDR", "BREW", "BRKL", "BRKR", "BRKS", "BRK_A", "BRK_B", "BRLI", "BRO", "BRS", "BRSS", "BRT", "BSET", "BSFT", "BSRR", "BSTC", "BSX", "BTH", "BTU", "BTX", "BURL", "BUSE", "BV", "BWA", "BWC", "BWINB", "BWLD", "BWS", "BXC", "BXLT", "BXP", "BXS", "BYD", "BYI", "BZH", "C", "CA", "CAB", "CAC", "CACB", "CACC", "CACI", "CACQ", "CAG", "CAH", "CAKE", "CALD", "CALL", "CALM", "CALX", "CAM", "CAMP", "CAP", "CAR", "CARA", "CARB", "CAS", "CASH", "CASS", "CASY", "CAT", "CATM", "CATO", "CATY", "CAVM", "CB", "CBB", "CBEY", "CBF", "CBG", "CBI", "CBK", "CBL", "CBM", "CBOE", "CBPX", "CBR", "CBRL", "CBS", "CBSH", "CBST", "CBT", "CBU", "CBZ", "CCBG", "CCC", "CCE", "CCF", "CCG", "CCI", "CCK", "CCL", "CCMP", "CCNE", "CCO", "CCOI", "CCRN", "CCXI", "CDE", "CDI", "CDNS", "CDR", "CE", "CEB", "CECE", "CECO", "CELG", "CEMP", "CENTA", "CENX", "CERN", "CERS", "CETV", "CEVA", "CF", "CFFI", "CFFN", "CFG", "CFI", "CFN", "CFNB", "CFNL", "CFR", "CFX", "CGI", "CGNX", "CHCO", "CHD", "CHDN", "CHDX", "CHE", "CHEF", "CHFC", "CHFN", "CHGG", "CHH", "CHK", "CHKP", "CHMG", "CHMT", "CHRW", "CHS", "CHSP", "CHTP", "CHTR", "CHUY", "CI", "CIA", "CIDM", "CIE", "CIEN", "CIFC", "CIM", "CINF", "CIR", "CIT", "CIX", "CJES", "CKEC", "CKH", "CKP", "CL", "CLC", "CLCT", "CLD", "CLDT", "CLDX", "CLF", "CLFD", "CLGX", "CLH", "CLI", "CLMS", "CLNE", "CLNY", "CLR", "CLUB", "CLVS", "CLW", "CLX", "CMA", "CMC", "CMCO", "CMCSA", "CMCSK", "CME", "CMG", "CMI", "CMLS", "CMN", "CMO", "CMP", "CMRX", "CMS", "CMTL", "CNA", "CNBC", "CNBKA", "CNC", "CNDO", "CNK", "CNL", "CNMD", "CNO", "CNOB", "CNP", "CNQR", "CNS", "CNSI", "CNSL", "CNVR", "CNW", "CNX", "COB", "COBZ", "COCO", "CODE", "COF", "COG", "COH", "COHR", "COHU", "COKE", "COL", "COLB", "COLM", "CONE", "CONN", "COO", "COP", "COR", "CORE", "CORR", "CORT", "COST", "COTY", "COUP", "COV", "COVS", "COWN", "CPA", "CPB", "CPE", "CPF", "CPGX", "CPHD", "CPK", "CPLA", "CPN", "CPRT", "CPS", "CPSI", "CPSS", "CPST", "CPT", "CPWR", "CQB", "CR", "CRAI", "CRAY", "CRCM", "CRD_B", "CREE", "CRI", "CRIS", "CRK", "CRL", "CRM", "CRMT", "CROX", "CRR", "CRRC", "CRRS", "CRS", "CRUS", "CRVL", "CRWN", "CRY", "CRZO", "CSBK", "CSC", "CSCD", "CSCO", "CSE", "CSFL", "CSG", "CSGP", "CSGS", "CSH", "CSII", "CSL", "CSLT", "CSOD", "CSRA", "CSS", "CST", "CSU", "CSV", "CSWC", "CSX", "CTAS", "CTB", "CTBI", "CTCT", "CTG", "CTIC", "CTL", "CTO", "CTRE", "CTRL", "CTRN", "CTRX", "CTS", "CTSH", "CTT", "CTWS", "CTXS", "CUB", "CUBE", "CUBI", "CUDA", "CUI", "CUNB", "CUR", "CUTR", "CUZ", "CVA", "CVBF", "CVC", "CVCO", "CVD", "CVEO", "CVG", "CVGI", "CVGW", "CVI", "CVLT", "CVO", "CVS", "CVT", "CVX", "CW", "CWCO", "CWEI", "CWH", "CWST", "CWT", "CXO", "CXW", "CY", "CYBX", "CYH", "CYN", "CYNI", "CYNO", "CYS", "CYT", "CYTK", "CYTR", "CYTX", "CZNC", "CZR", "D", "DAKT", "DAL", "DAN", "DAR", "DATA", "DAVE", "DBD", "DCI", "DCO", "DCOM", "DCT", "DD", "DDD", "DDR", "DDS", "DE", "DECK", "DEI", "DEL", "DELL", "DENN", "DEPO", "DEST", "DF", "DFRG", "DFS", "DFT", "DFZ", "DG", "DGAS", "DGI", "DGICA", "DGII", "DGX", "DHI", "DHIL", "DHR", "DHT", "DHX", "DIN", "DIOD", "DIS", "DISCA", "DISCK", "DISH", "DJCO", "DK", "DKS", "DLB", "DLLR", "DLPH", "DLR", "DLTR", "DLX", "DMD", "DMND", "DMRC", "DNB", "DNDN", "DNKN", "DNR", "DO", "DOC", "DOOR", "DORM", "DOV", "DOW", "DOX", "DPS", "DPZ", "DRC", "DRE", "DRH", "DRI", "DRII", "DRIV", "DRL", "DRNA", "DRQ", "DRTX", "DSCI", "DSPG", "DST", "DSW", "DTE", "DTLK", "DTSI", "DTV", "DUK", "DV", "DVA", "DVAX", "DVN", "DVR", "DW", "DWA", "DWRE", "DWSN", "DX", "DXCM", "DXLG", "DXM", "DXPE", "DXYN", "DY", "DYAX", "DYN", "EA", "EAC", "EAT", "EBAY", "EBF", "EBIO", "EBIX", "EBS", "EBSB", "EBTC", "ECHO", "ECL", "ECOL", "ECOM", "ECPG", "ECYT", "ED", "EDE", "EDIG", "EDMC", "EDR", "EE", "EEFT", "EFII", "EFSC", "EFX", "EGAN", "EGBN", "EGHT", "EGL", "EGLT", "EGN", "EGOV", "EGP", "EGY", "EHTH", "EIG", "EIGI", "EIX", "EL", "ELGX", "ELLI", "ELNK", "ELRC", "ELS", "ELX", "ELY", "EMC", "EMCI", "EME", "EMN", "EMR", "END", "ENDP", "ENH", "ENOC", "ENPH", "ENR", "ENS", "ENSG", "ENT", "ENTA", "ENTG", "ENTR", "ENV", "ENVE", "ENZ", "ENZN", "EOG", "EOPN", "EOX", "EPAM", "EPAY", "EPIQ", "EPL", "EPM", "EPR", "EPZM", "EQIX", "EQR", "EQT", "EQU", "EQY", "ERA", "ERIE", "ERII", "EROS", "ES", "ESBF", "ESC", "ESCA", "ESE", "ESGR", "ESI", "ESIO", "ESL", "ESNT", "ESPR", "ESRT", "ESRX", "ESS", "ESSA", "ESV", "ETFC", "ETH", "ETM", "ETN", "ETR", "EV", "EVC", "EVDY", "EVER", "EVR", "EVRY", "EVTC", "EW", "EWBC", "EXAC", "EXAM", "EXAR", "EXAS", "EXC", "EXEL", "EXH", "EXL", "EXLS", "EXP", "EXPD", "EXPE", "EXPO", "EXPR", "EXR", "EXTR", "EXXI", "EZPW", "F", "FAF", "FANG", "FARM", "FARO", "FAST", "FB", "FBC", "FBHS", "FBIZ", "FBNC", "FBNK", "FBP", "FBRC", "FC", "FCBC", "FCEL", "FCE_A", "FCF", "FCFS", "FCH", "FCN", "FCNCA", "FCS", "FCSC", "FCX", "FDEF", "FDML", "FDO", "FDP", "FDS", "FDUS", "FDX", "FE", "FEIC", "FELE", "FET", "FF", "FFBC", "FFBH", "FFG", "FFIC", "FFIN", "FFIV", "FFKT", "FFNW", "FGL", "FHCO", "FHN", "FIBK", "FICO", "FII", "FINL", "FIO", "FIS", "FISI", "FISV", "FITB", "FIVE", "FIVN", "FIX", "FIZZ", "FL", "FLDM", "FLIC", "FLIR", "FLO", "FLR", "FLS", "FLT", "FLTX", "FLWS", "FLXN", "FLXS", "FMBI", "FMC", "FMD", "FMER", "FMI", "FN", "FNB", "FNF", "FNFG", "FNGN", "FNHC", "FNLC", "FNSR", "FOE", "FOLD", "FOR", "FORM", "FORR", "FOSL", "FOX", "FOXA", "FOXF", "FPO", "FPRX", "FR", "FRAN", "FRBK", "FRC", "FRED", "FRF", "FRGI", "FRM", "FRME", "FRNK", "FRO", "FRP", "FRSH", "FRT", "FRX", "FSC", "FSGI", "FSL", "FSLR", "FSP", "FSS", "FST", "FSTR", "FSYS", "FTD", "FTI", "FTK", "FTNT", "FTR", "FTV", "FUBC", "FUEL", "FUL", "FULT", "FUR", "FURX", "FVE", "FWM", "FWRD", "FXCB", "FXCM", "FXEN", "G", "GABC", "GAIA", "GAIN", "GALE", "GALT", "GARS", "GAS", "GB", "GBCI", "GBDC", "GBL", "GBLI", "GBNK", "GBX", "GCA", "GCAP", "GCI", "GCO", "GD", "GDOT", "GDP", "GE", "GEF", "GEO", "GEOS", "GERN", "GES", "GEVA", "GFF", "GFIG", "GFN", "GGG", "GGP", "GHC", "GHDX", "GHL", "GHM", "GIFI", "GIII", "GILD", "GIMO", "GIS", "GK", "GLAD", "GLDD", "GLF", "GLNG", "GLOG", "GLPW", "GLRE", "GLRI", "GLT", "GLUU", "GLW", "GM", "GMAN", "GMCR", "GME", "GMED", "GMO", "GMT", "GNC", "GNCA", "GNCMA", "GNE", "GNMK", "GNRC", "GNTX", "GNW", "GOGO", "GOLD", "GOOD", "GOOG", "GOOGL", "GORO", "GOV", "GPC", "GPI", "GPK", "GPN", "GPOR", "GPRE", "GPS", "GPT", "GPX", "GRA", "GRC", "GRIF", "GRMN", "GRPN", "GRT", "GRUB", "GS", "GSAT", "GSBC", "GSBD", "GSIG", "GSIT", "GSM", "GSOL", "GST", "GSVC", "GT", "GTAT", "GTI", "GTIV", "GTLS", "GTN", "GTS", "GTT", "GTXI", "GTY", "GUID", "GVA", "GWR", "GWRE", "GWW", "GXP", "GY", "H", "HA", "HAE", "HAFC", "HAIN", "HAL", "HALL", "HALO", "HAR", "HAS", "HASI", "HAWK", "HAYN", "HBAN", "HBCP", "HBHC", "HBI", "HBIO", "HBNC", "HCA", "HCBK", "HCC", "HCCI", "HCI", "HCKT", "HCN", "HCOM", "HCP", "HCSG", "HCT", "HD", "HDNG", "HE", "HEAR", "HEES", "HEI", "HELE", "HELI", "HEOP", "HERO", "HES", "HF", "HFC", "HFWA", "HGG", "HGR", "HHC", "HHS", "HI", "HIBB", "HIFS", "HIG", "HII", "HIIQ", "HIL", "HILL", "HITK", "HITT", "HIVE", "HIW", "HK", "HL", "HLF", "HLIT", "HLS", "HLSS", "HLX", "HME", "HMHC", "HMN", "HMPR", "HMST", "HMSY", "HMTV", "HNH", "HNI", "HNR", "HNRG", "HNT", "HOFT", "HOG", "HOLX", "HOMB", "HOME", "HON", "HOS", "HOT", "HOV", "HP", "HPE", "HPP", "HPQ", "HPT", "HPTX", "HPY", "HR", "HRB", "HRC", "HRG", "HRL", "HRS", "HRTG", "HRTX", "HRZN", "HSC", "HSH", "HSIC", "HSII", "HSNI", "HSP", "HST", "HSTM", "HSY", "HT", "HTA", "HTBI", "HTBK", "HTCH", "HTCO", "HTGC", "HTH", "HTLD", "HTLF", "HTS", "HTWR", "HTZ", "HUBG", "HUB_B", "HUM", "HUN", "HURC", "HURN", "HVB", "HVT", "HW", "HWAY", "HWCC", "HWKN", "HXL", "HY", "HZNP", "HZO", "I", "IACI", "IART", "IBCA", "IBCP", "IBKC", "IBKR", "IBM", "IBOC", "IBP", "IBTX", "ICE", "ICEL", "ICFI", "ICGE", "ICON", "ICPT", "ICUI", "IDA", "IDCC", "IDIX", "IDRA", "IDT", "IDTI", "IDXX", "IEX", "IFF", "IFT", "IG", "IGT", "IGTE", "IHC", "IHS", "III", "IIIN", "IILG", "IIVI", "IL", "ILMN", "IM", "IMGN", "IMI", "IMKTA", "IMMR", "IMMU", "IMN", "IMPV", "INAP", "INCY", "INDB", "INFA", "INFI", "INFN", "INGN", "INGR", "ININ", "INN", "INO", "INSM", "INSY", "INT", "INTC", "INTL", "INTU", "INTX", "INVN", "INWK", "IO", "IOSP", "IP", "IPAR", "IPCC", "IPCM", "IPG", "IPGP", "IPHI", "IPHS", "IPI", "IPXL", "IQNT", "IR", "IRBT", "IRC", "IRDM", "IRET", "IRF", "IRG", "IRM", "IRWD", "ISBC", "ISCA", "ISH", "ISIL", "ISIS", "ISLE", "ISRG", "ISRL", "ISSC", "ISSI", "IT", "ITC", "ITCI", "ITG", "ITIC", "ITMN", "ITRI", "ITT", "ITW", "IVAC", "IVC", "IVR", "IVZ", "IXYS", "JACK", "JAH", "JAKK", "JBHT", "JBL", "JBLU", "JBSS", "JBT", "JCI", "JCOM", "JCP", "JDSU", "JEC", "JGW", "JIVE", "JJSF", "JKHY", "JLL", "JMBA", "JNJ", "JNPR", "JNS", "JNY", "JOE", "JONE", "JOUT", "JOY", "JPM", "JRN", "JWN", "JW_A", "K", "KAI", "KALU", "KAMN", "KAR", "KBALB", "KBH", "KBR", "KCG", "KCLI", "KEG", "KELYA", "KEM", "KERX", "KEX", "KEY", "KEYW", "KFRC", "KFX", "KFY", "KHC", "KIM", "KIN", "KIRK", "KKD", "KLAC", "KMB", "KMG", "KMI", "KMPR", "KMT", "KMX", "KND", "KNL", "KNX", "KO", "KODK", "KOG", "KOP", "KOPN", "KORS", "KOS", "KPTI", "KR", "KRA", "KRC", "KRFT", "KRG", "KRNY", "KRO", "KS", "KSS", "KSU", "KTOS", "KTWO", "KVHI", "KW", "KWK", "KWR", "KYTH", "L", "LABL", "LAD", "LADR", "LAMR", "LANC", "LAYN", "LAZ", "LB", "LBAI", "LBMH", "LBTYA", "LBY", "LCI", "LCNB", "LCUT", "LDL", "LDOS", "LDR", "LDRH", "LE", "LEA", "LEAF", "LECO", "LEE", "LEG", "LEN", "LF", "LFUS", "LFVN", "LG", "LGF", "LGIH", "LGND", "LH", "LHCG", "LHO", "LIFE", "LII", "LINC", "LINTA", "LION", "LIOX", "LKFN", "LKQ", "LL", "LLEN", "LLL", "LLNW", "LLTC", "LLY", "LM", "LMCA", "LMIA", "LMNR", "LMNX", "LMOS", "LMT", "LNC", "LNCE", "LNDC", "LNG", "LNKD", "LNN", "LNT", "LO", "LOCK", "LOGM", "LOPE", "LORL", "LOV", "LOW", "LPG", "LPI", "LPLA", "LPNT", "LPSN", "LPX", "LQ", "LQDT", "LRCX", "LRN", "LSCC", "LSI", "LSTR", "LTC", "LTM", "LTS", "LTXC", "LUB", "LUK", "LUV", "LVLT", "LVNTA", "LVS", "LWAY", "LXFT", "LXK", "LXP", "LXRX", "LXU", "LYB", "LYTS", "LYV", "LZB", "M", "MA", "MAC", "MACK", "MAIN", "MAN", "MANH", "MANT", "MAR", "MAS", "MASI", "MAT", "MATW", "MATX", "MBFI", "MBI", "MBII", "MBRG", "MBUU", "MBVT", "MBWM", "MC", "MCBC", "MCC", "MCD", "MCF", "MCGC", "MCHP", "MCHX", "MCK", "MCO", "MCP", "MCRI", "MCRL", "MCRS", "MCS", "MCY", "MD", "MDAS", "MDC", "MDCA", "MDCI", "MDCO", "MDLZ", "MDP", "MDR", "MDRX", "MDSO", "MDT", "MDU", "MDVN", "MDW", "MDXG", "MEAS", "MED", "MEG", "MEI", "MEIP", "MENT", "MET", "METR", "MFA", "MFLX", "MFRM", "MG", "MGAM", "MGEE", "MGI", "MGLN", "MGM", "MGNX", "MGRC", "MHFI", "MHGC", "MHK", "MHLD", "MHO", "MHR", "MIDD", "MIG", "MIL", "MILL", "MIND", "MINI", "MITK", "MITT", "MJN", "MKC", "MKL", "MKSI", "MKTO", "MKTX", "MLAB", "MLHR", "MLI", "MLM", "MLNK", "MLR", "MM", "MMC", "MMI", "MMM", "MMS", "MMSI", "MN", "MNI", "MNK", "MNKD", "MNR", "MNRO", "MNST", "MNTA", "MNTX", "MO", "MOD", "MODN", "MOFG", "MOG_A", "MOH", "MON", "MORN", "MOS", "MOSY", "MOV", "MOVE", "MPAA", "MPC", "MPO", "MPW", "MPWR", "MPX", "MRC", "MRCY", "MRGE", "MRH", "MRIN", "MRK", "MRLN", "MRO", "MRTN", "MRTX", "MRVL", "MS", "MSA", "MSCC", "MSCI", "MSEX", "MSFG", "MSFT", "MSG", "MSI", "MSL", "MSM", "MSO", "MSTR", "MTB", "MTD", "MTDR", "MTG", "MTGE", "MTH", "MTN", "MTOR", "MTRN", "MTRX", "MTSC", "MTSI", "MTW", "MTX", "MTZ", "MU", "MUR", "MUSA", "MVC", "MVNR", "MW", "MWA", "MWIV", "MWV", "MWW", "MXIM", "MXL", "MXWL", "MYCC", "MYE", "MYGN", "MYL", "MYRG", "N", "NADL", "NANO", "NASB", "NAT", "NATH", "NATI", "NATL", "NATR", "NAV", "NAVB", "NAVG", "NAVI", "NBBC", "NBCB", "NBHC", "NBIX", "NBL", "NBR", "NBS", "NBTB", "NC", "NCFT", "NCI", "NCLH", "NCMI", "NCR", "NCS", "NDAQ", "NDLS", "NDSN", "NE", "NEE", "NEM", "NEO", "NEOG", "NEON", "NES", "NETE", "NEU", "NEWM", "NEWP", "NEWS", "NFBK", "NFG", "NFLX", "NFX", "NGHC", "NGPC", "NGS", "NGVC", "NHC", "NHI", "NI", "NICK", "NIHD", "NILE", "NJR", "NKE", "NKSH", "NKTR", "NL", "NLNK", "NLS", "NLSN", "NLY", "NM", "NMBL", "NMFC", "NMIH", "NMRX", "NNA", "NNBR", "NNI", "NNVC", "NOC", "NOG", "NOR", "NOV", "NOW", "NP", "NPBC", "NPK", "NPO", "NPSP", "NPTN", "NR", "NRCIA", "NRG", "NRIM", "NRZ", "NSC", "NSIT", "NSM", "NSP", "NSPH", "NSR", "NSTG", "NTAP", "NTCT", "NTGR", "NTK", "NTLS", "NTRI", "NTRS", "NU", "NUAN", "NUE", "NUS", "NUTR", "NUVA", "NVAX", "NVDA", "NVEC", "NVR", "NWBI", "NWBO", "NWE", "NWHM", "NWL", "NWLI", "NWN", "NWPX", "NWS", "NWSA", "NWY", "NX", "NXST", "NXTM", "NYCB", "NYLD", "NYMT", "NYNY", "NYRT", "NYT", "O", "OABC", "OAS", "OB", "OC", "OCFC", "OCLR", "OCN", "OCR", "ODC", "ODFL", "ODP", "OEH", "OFC", "OFG", "OFIX", "OFLX", "OGE", "OGS", "OGXI", "OHI", "OHRP", "OI", "OII", "OIS", "OKE", "OKSB", "OLBK", "OLED", "OLN", "OLP", "OMC", "OMCL", "OME", "OMED", "OMER", "OMEX", "OMG", "OMI", "OMN", "ONB", "ONE", "ONNN", "ONTY", "ONVO", "OPB", "OPEN", "OPHT", "OPK", "OPLK", "OPWR", "OPY", "ORA", "ORB", "ORBC", "ORCL", "OREX", "ORI", "ORIT", "ORLY", "ORM", "ORN", "OSIR", "OSIS", "OSK", "OSTK", "OSUR", "OTTR", "OUTR", "OVAS", "OVTI", "OWW", "OXFD", "OXM", "OXY", "OZRK", "P", "PACB", "PACR", "PACW", "PAG", "PAHC", "PANW", "PATK", "PATR", "PAY", "PAYC", "PAYX", "PB", "PBCT", "PBF", "PBH", "PBI", "PBPB", "PBY", "PBYI", "PCAR", "PCBK", "PCCC", "PCG", "PCH", "PCL", "PCLN", "PCO", "PCP", "PCRX", "PCTI", "PCTY", "PCYC", "PCYG", "PCYO", "PDCE", "PDCO", "PDFS", "PDLI", "PDM", "PE", "PEB", "PEBO", "PEG", "PEGA", "PEGI", "PEI", "PEIX", "PENN", "PENX", "PEP", "PERI", "PERY", "PES", "PETM", "PETS", "PETX", "PF", "PFBC", "PFE", "PFG", "PFIE", "PFIS", "PFLT", "PFMT", "PFPT", "PFS", "PFSI", "PG", "PGC", "PGEM", "PGI", "PGNX", "PGR", "PGTI", "PH", "PHH", "PHIIK", "PHM", "PHMD", "PHX", "PICO", "PII", "PIKE", "PIR", "PJC", "PKD", "PKE", "PKG", "PKI", "PKOH", "PKT", "PKY", "PL", "PLAB", "PLCE", "PLCM", "PLD", "PLKI", "PLL", "PLMT", "PLOW", "PLPC", "PLPM", "PLT", "PLUG", "PLUS", "PLXS", "PLXT", "PM", "PMC", "PMCS", "PMFG", "PMT", "PNC", "PNFP", "PNK", "PNM", "PNNT", "PNR", "PNRA", "PNW", "PNX", "PNY", "PODD", "POL", "POM", "POOL", "POR", "POST", "POWI", "POWL", "POWR", "POZN", "PPBI", "PPC", "PPG", "PPHM", "PPL", "PPO", "PPS", "PQ", "PRA", "PRAA", "PRE", "PRFT", "PRGO", "PRGS", "PRGX", "PRI", "PRIM", "PRK", "PRKR", "PRLB", "PRO", "PROV", "PRSC", "PRTA", "PRU", "PRXL", "PSA", "PSB", "PSEC", "PSEM", "PSIX", "PSMI", "PSMT", "PSTB", "PSUN", "PSX", "PTCT", "PTEN", "PTGI", "PTIE", "PTLA", "PTP", "PTRY", "PTSI", "PTX", "PVA", "PVH", "PVTB", "PWOD", "PWR", "PX", "PXD", "PYPL", "PZG", "PZN", "PZZA", "Q", "QADA", "QCOM", "QCOR", "QDEL", "QEP", "QGEN", "QLGC", "QLIK", "QLTY", "QLYS", "QNST", "QRHC", "QRVO", "QSII", "QTM", "QTS", "QTWO", "QUAD", "QUIK", "R", "RAD", "RAI", "RAIL", "RALY", "RARE", "RAS", "RATE", "RAVN", "RAX", "RBC", "RBCAA", "RBCN", "RCAP", "RCII", "RCKB", "RCL", "RCPT", "RDC", "RDEN", "RDI", "RDN", "RDNT", "RE", "RECN", "REG", "REGI", "REGN", "REI", "REIS", "RELL", "REMY", "REN", "RENT", "RES", "RESI", "REV", "REX", "REXI", "REXR", "REXX", "RF", "RFMD", "RFP", "RGA", "RGC", "RGDO", "RGEN", "RGLD", "RGLS", "RGR", "RGS", "RH", "RHI", "RHP", "RHT", "RIG", "RIGL", "RJET", "RJF", "RKT", "RKUS", "RL", "RLD", "RLGY", "RLI", "RLJ", "RLOC", "RLYP", "RM", "RMAX", "RMBS", "RMD", "RMTI", "RNDY", "RNET", "RNG", "RNR", "RNST", "RNWK", "ROC", "ROCK", "ROG", "ROIAK", "ROIC", "ROK", "ROL", "ROLL", "ROP", "ROSE", "ROST", "ROVI", "RP", "RPAI", "RPM", "RPRX", "RPT", "RPTP", "RPXC", "RRC", "RRD", "RRGB", "RRTS", "RS", "RSE", "RSG", "RSH", "RSO", "RSPP", "RST", "RSTI", "RSYS", "RT", "RTEC", "RTI", "RTIX", "RTK", "RTN", "RTRX", "RUBI", "RUSHA", "RUTH", "RVBD", "RVLT", "RVNC", "RWT", "RXN", "RYL", "RYN", "S", "SAAS", "SAFM", "SAFT", "SAH", "SAIA", "SAIC", "SALE", "SALM", "SALT", "SAM", "SAMG", "SANM", "SAPE", "SASR", "SATS", "SAVE", "SB", "SBAC", "SBCF", "SBGI", "SBH", "SBNY", "SBRA", "SBSI", "SBUX", "SBY", "SCAI", "SCBT", "SCCO", "SCG", "SCHL", "SCHN", "SCHW", "SCI", "SCL", "SCLN", "SCM", "SCMP", "SCOR", "SCS", "SCSC", "SCSS", "SCTY", "SCVL", "SD", "SDRL", "SE", "SEAC", "SEAS", "SEB", "SEE", "SEIC", "SEM", "SEMG", "SENEA", "SF", "SFBS", "SFE", "SFG", "SFL", "SFLY", "SFNC", "SFXE", "SFY", "SGA", "SGBK", "SGEN", "SGI", "SGK", "SGM", "SGMO", "SGMS", "SGNT", "SGY", "SGYP", "SHEN", "SHLD", "SHLM", "SHLO", "SHO", "SHOO", "SHOR", "SHOS", "SHW", "SIAL", "SIF", "SIG", "SIGA", "SIGI", "SIGM", "SIMG", "SIR", "SIRI", "SIRO", "SIVB", "SIX", "SJI", "SJM", "SJW", "SKH", "SKT", "SKUL", "SKX", "SKYW", "SLAB", "SLB", "SLCA", "SLG", "SLGN", "SLH", "SLM", "SLRC", "SLXP", "SM", "SMA", "SMCI", "SMG", "SMP", "SMRT", "SMTC", "SN", "SNA", "SNAK", "SNBC", "SNCR", "SNDK", "SNH", "SNHY", "SNI", "SNMX", "SNOW", "SNPS", "SNSS", "SNTA", "SNV", "SNX", "SO", "SON", "SONC", "SONS", "SP", "SPA", "SPAR", "SPB", "SPDC", "SPF", "SPG", "SPGI", "SPLK", "SPLS", "SPN", "SPNC", "SPNS", "SPPI", "SPR", "SPRT", "SPSC", "SPTN", "SPW", "SPWH", "SPWR", "SQBG", "SQBK", "SQI", "SQNM", "SRCE", "SRCL", "SRDX", "SRE", "SREV", "SRI", "SRPT", "SSD", "SSI", "SSNC", "SSNI", "SSP", "SSS", "SSTK", "SSYS", "STAA", "STAG", "STAR", "STBA", "STBZ", "STC", "STCK", "STE", "STFC", "STI", "STJ", "STL", "STLD", "STML", "STMP", "STNG", "STNR", "STR", "STRA", "STRL", "STRT", "STRZA", "STSA", "STSI", "STT", "STWD", "STX", "STZ", "SUBK", "SUI", "SUN", "SUNE", "SUNS", "SUP", "SUPN", "SUPX", "SUSQ", "SUSS", "SVU", "SVVC", "SWAY", "SWC", "SWFT", "SWHC", "SWI", "SWK", "SWKS", "SWM", "SWN", "SWS", "SWSH", "SWX", "SWY", "SXC", "SXI", "SXT", "SYA", "SYBT", "SYF", "SYK", "SYKE", "SYMC", "SYNA", "SYNT", "SYRG", "SYUT", "SYX", "SYY", "SZMK", "SZYM", "T", "TAHO", "TAL", "TAM", "TAP", "TASR", "TAST", "TAT", "TAX", "TAXI", "TAYC", "TBBK", "TBI", "TBNK", "TBPH", "TCAP", "TCB", "TCBI", "TCBK", "TCO", "TCPC", "TCRD", "TCS", "TDC", "TDG", "TDS", "TDW", "TDY", "TE", "TEAR", "TECD", "TECH", "TECUA", "TEG", "TEL", "TEN", "TER", "TESO", "TESS", "TEX", "TFM", "TFSL", "TFX", "TG", "TGE", "TGH", "TGI", "TGNA", "TGT", "TGTX", "THC", "THFF", "THG", "THLD", "THO", "THOR", "THR", "THRM", "THRX", "THS", "TIBX", "TICC", "TIF", "TILE", "TIME", "TIPT", "TIS", "TISI", "TITN", "TIVO", "TJX", "TK", "TKR", "TLMR", "TLYS", "TMH", "TMHC", "TMK", "TMO", "TMP", "TMUS", "TNAV", "TNC", "TNDM", "TNET", "TNGO", "TNK", "TOL", "TOWN", "TOWR", "TPC", "TPH", "TPLM", "TPRE", "TPX", "TQNT", "TR", "TRAK", "TRC", "TREC", "TREE", "TREX", "TRGP", "TRGT", "TRI", "TRIP", "TRIV", "TRK", "TRLA", "TRMB", "TRMK", "TRMR", "TRN", "TRNO", "TRNX", "TROW", "TROX", "TRR", "TRS", "TRST", "TRUE", "TRV", "TRW", "TRXC", "TSC", "TSCO", "TSLA", "TSN", "TSO", "TSRA", "TSRE", "TSRO", "TSS", "TSYS", "TTC", "TTEC", "TTEK", "TTGT", "TTI", "TTMI", "TTPH", "TTS", "TTWO", "TUES", "TUMI", "TUP", "TW", "TWC", "TWER", "TWGP", "TWI", "TWIN", "TWMC", "TWO", "TWOU", "TWTC", "TWTR", "TWX", "TXI", "TXMD", "TXN", "TXRH", "TXT", "TXTR", "TYC", "TYL", "TYPE", "TZOO", "UA", "UACL", "UAL", "UAM", "UA_C", "UBA", "UBNK", "UBNT", "UBSH", "UBSI", "UCBI", "UCFC", "UCP", "UCTT", "UDR", "UEC", "UEIC", "UFCS", "UFI", "UFPI", "UFPT", "UFS", "UGI", "UHAL", "UHS", "UHT", "UIHC", "UIL", "UIS", "ULTA", "ULTI", "ULTR", "UMBF", "UMH", "UMPQ", "UNF", "UNFI", "UNH", "UNIS", "UNM", "UNP", "UNS", "UNT", "UNTD", "UNXL", "UPIP", "UPL", "UPS", "URBN", "URG", "URI", "URS", "USAK", "USAP", "USB", "USCR", "USG", "USLM", "USM", "USMD", "USMO", "USNA", "USPH", "USTR", "UTEK", "UTHR", "UTI", "UTIW", "UTL", "UTMD", "UTX", "UVE", "UVSP", "UVV", "V", "VAC", "VAL", "VAR", "VASC", "VC", "VCRA", "VCYT", "VDSI", "VECO", "VFC", "VG", "VGR", "VHC", "VIAB", "VIAS", "VICL", "VICR", "VITC", "VIVO", "VLCCF", "VLGEA", "VLO", "VLY", "VMC", "VMEM", "VMI", "VMW", "VNCE", "VNDA", "VNO", "VNTV", "VOCS", "VOD", "VOLC", "VOXX", "VOYA", "VPFG", "VPG", "VPRT", "VR", "VRA", "VRNG", "VRNS", "VRNT", "VRSK", "VRSN", "VRTS", "VRTU", "VRTX", "VRX", "VSAR", "VSAT", "VSEC", "VSH", "VSI", "VSTM", "VTG", "VTL", "VTNR", "VTR", "VTSS", "VVC", "VVI", "VVTV", "VVUS", "VZ", "WAB", "WABC", "WAC", "WAFD", "WAG", "WAGE", "WAIR", "WAL", "WASH", "WAT", "WBA", "WBC", "WBCO", "WBMD", "WBS", "WCC", "WCG", "WCIC", "WCN", "WD", "WDAY", "WDC", "WDFC", "WDR", "WEC", "WEN", "WERN", "WETF", "WEX", "WEYS", "WFC", "WFD", "WFM", "WG", "WGL", "WGO", "WHF", "WHG", "WHR", "WIBC", "WIFI", "WIN", "WINA", "WIRE", "WIX", "WLB", "WLH", "WLK", "WLL", "WLP", "WLT", "WLTW", "WM", "WMAR", "WMB", "WMC", "WMGI", "WMK", "WMT", "WNC", "WNR", "WOOF", "WOR", "WPP", "WPX", "WR", "WRB", "WRE", "WRES", "WRI", "WRK", "WRLD", "WSBC", "WSBF", "WSFS", "WSM", "WSO", "WSR", "WST", "WSTC", "WSTL", "WTBA", "WTFC", "WTI", "WTM", "WTR", "WTS", "WTSL", "WTW", "WU", "WWAV", "WWD", "WWE", "WWW", "WWWW", "WY", "WYN", "WYNN", "X", "XCO", "XCRA", "XEC", "XEL", "XL", "XLNX", "XLRN", "XLS", "XNCR", "XNPT", "XOM", "XOMA", "XON", "XONE", "XOOM", "XOXO", "XPO", "XRAY", "XRM", "XRX", "XXIA", "XXII", "XYL", "Y", "YDKN", "YELP", "YHOO", "YORW", "YRCW", "YUM", "YUME", "Z", "ZAGG", "ZAZA", "ZBH", "ZBRA", "ZEN", "ZEP", "ZEUS", "ZGNX", "ZIGO", "ZINC", "ZION", "ZIOP", "ZIXI", "ZLC", "ZLTQ", "ZMH", "ZNGA", "ZOES", "ZQK", "ZTS", "ZUMZ"];
