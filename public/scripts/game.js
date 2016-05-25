
var Game = React.createClass({
  loadQuestionsFromJson: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.props.setQuestions(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function() {
    this.loadQuestionsFromJson();
  },
  render: function() {
    return(
      <div>
          {
            this.props.data.nameSomethingThatFirefoxDoes && <header><h1>{this.props.data.nameSomethingThatFirefoxDoes[0]}</h1></header>
          }
          <AnswerSection />
          <section className="strikes">
          	<div className="one-strike">☒</div>
          	<div className="two-strikes">☒☒</div>
          	<div className="three-strikes">☒☒☒</div>
          </section>
          </div>
    );
  }
});

var AnswerContainer = React.createClass({
  render: function() {
    return(
      <div className="flip-container">
        <div className="flipper">
          <div className="front face">{this.props.index}</div>
          <div className="back face">
            <span className="answer">{this.props.answer}</span>
            <span className="points">{this.props.count}</span>
          </div>
        </div>
      </div>
    );
  }
});

var AnswerSection = React.createClass({
  componentDidMount: function() {
  },
  calculateContainers: function() {
    var containers = [];
    var sortable = [];
    var count_total = {};
    if (this.props.data.nameSomethingThatFirefoxDoes) {
      this.props.data.nameSomethingThatFirefoxDoes.forEach(function(answer){
         count_total[answer] = (count_total[answer] || 0) + 1;
      });
      for (var key in count_total) {
        sortable.push([key, count_total[key]])
      }
      sortable.sort(function(a, b) {return  b[1] - a[1]})
      $.each(sortable, function(i, value) {
        var answer = value[0];
        var count = value[1];
        containers.push(<AnswerContainer key={i} index={i+1} answer={answer} count={count}/>);
      });
    }
    return containers;
  },
  render: function() {
    return(
      <div>
        {this.calculateContainers()}
      </div>
    );
  }

});



//createStore, provider, and set initial State
var createStore = Redux.createStore;
var Provider = ReactRedux.Provider;
var connect = ReactRedux.connect;

var initialState = {
  data: [],
  url: "/api/feud-data",
}

var reducer = function(state, action) {
  if (state === undefined) {
    return initialState;
  }
  var newState = state;

  switch(action.type) {
    case 'set_questions':
      newState = Object.assign({}, state, {data: action.data})
      break;
  }
  return newState;
}

var store = createStore(reducer, initialState);

//Pass initial state to game as props
var GameState = function(state) {
  return{
    url: state.url,
    data: state.data
  }
}

var GameDispatch = function(dispatch) {
  return {
    setQuestions: function(data) {
      dispatch({
        type: 'set_questions',
        data: data
      })
    }
  }
}

Game = connect(
  GameState,
  GameDispatch
)(Game)
AnswerContainer = connect(
   GameState,
   GameDispatch
)(AnswerContainer)
AnswerSection = connect(
  GameState,
  GameDispatch
)(AnswerSection)

ReactDOM.render(
  <Provider store={store}>
      <Game/>
  </Provider>,
  document.getElementById('content')
);
