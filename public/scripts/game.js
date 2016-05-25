
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
          <div className="front face">1</div>
          <div className="back face"><span className="answer">{this.props.answer}</span> <span className="points">30</span></div>
        </div>
      </div>
    );
  }
});

var AnswerSection = React.createClass({
  componentDidMount: function() {
    console.log("Answers", this.props.data)
  },
  calculateContainers: function() {
    var containers = []
    if (this.props.data.nameSomethingThatFirefoxDoes) {
      this.props.data.nameSomethingThatFirefoxDoes.forEach(function(answer, i){

         containers.push(<AnswerContainer key={i} answer={answer}/>);

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
