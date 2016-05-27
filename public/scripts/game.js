var StartPage = React.createClass({
  render: function() {
    var self = this;
    socket.on('update game', function(data){
      self.props.updateState(Object.assign({}, data, {judge: self.props.judge}));
    });
    var play = this.props.beginGame;
    var content = play? <Game /> : <div><p>Welcome</p><button onClick={this.props.startPlay}> Play!</button><button onClick={this.props.becomeJudge}>judge</button></div>;
    return (
      <div>
        {content}
      </div>
    )
  }
});

var Game = React.createClass({
  loadQuestionsFromJson: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.shuffleQuestions(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function() {
    this.loadQuestionsFromJson();
  },
  shuffleQuestions: function(data) {
    //randomize the keys to the questions (originally they are in alphabetical order)
    var keys = Object.keys(data);
    var shuffled = keys.slice(0), i = keys.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    this.props.setQuestions(data, shuffled);
  },
  triggerStrike: function() {
    this.props.incrementStrikeCount(this.props.strikeCount + 1);
  },
  nextQuestion: function() {
    this.props.advanceQuestion();
  },
  render: function() {
    return(
      <div>
        {
          this.props.data.nameSomethingThatFirefoxDoes && <header><h1>{this.props.keys[this.props.currentQuestion].replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}</h1></header>
        }
        <AnswerSection />
        <section className="strikes">
        	<div className="one-strike">☒</div>
        	<div className="two-strikes">☒☒</div>
        	<div className="three-strikes">☒☒☒</div>
        </section>
        {this.props.judge &&
          <div>
            <button onClick={this.triggerStrike}> Wrong! </button>
            <button onClick={this.nextQuestion}> Next Question </button>
          </div>
        }
      </div>
    );
  }
});

var AnswerContainer = React.createClass({
  emitRevealAnswer: function(e) {
    if (this.props.judge) {
      this.props.addRevealedAnswer(this.props.index);
    }
  },
  render: function() {
    var reveal = '';
    var clicked = false;
    var index = this.props.index;
    this.props.revealedAnswers.forEach(function(revealed){
      if (revealed === index) {
        clicked = true;
      }
    });
    if (this.props.judge && clicked) {
      reveal = ' reveal clicked';
    } else if (this.props.judge || clicked) {
      reveal = ' reveal';
    }

    return(
      <div className={'flip-container' + reveal} onClick={this.emitRevealAnswer}>
        <div className='flipper'>
          <div className='front face'>{index}</div>
          <div className='back face'>
            <span className='answer'>{this.props.answer}</span>
            <span className='points'>{this.props.count}</span>
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
    if (this.props.keys.length) {
      this.props.data[this.props.keys[this.props.currentQuestion]].forEach(function(answer){
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
      <section className='answers'>
        {this.calculateContainers()}
      </section>
    );
  }

});

//createStore, provider, and set initial State
var createStore = Redux.createStore;
var Provider = ReactRedux.Provider;
var connect = ReactRedux.connect;

var initialState = {
  currentQuestion: 0,
  strikeCount: 0,
  judge: false,
  beginGame: false,
  keys: [],
  data: [],
  url: '/api/feud-data',
  revealedAnswers: []
}

var reducer = function(state, action) {
  if (state === undefined) {
    return initialState;
  }
  var newState = state;

  switch(action.type) {
    case 'set_questions':
      newState = Object.assign({}, state, {data: action.data, keys: action.keys});
      socket.emit('update game', newState);
      break;
    case 'advance_question':
      var nextQuestion = state.currentQuestion + 1;
      newState = Object.assign({}, state, { strikeCount: 0, currentQuestion: nextQuestion, revealedAnswers: [] });
      socket.emit('update game', newState);
      break;
    case 'start_play':
      newState = Object.assign({}, state, {beginGame: true});
      break;
    case 'become_judge':
      newState = Object.assign({}, state, {judge: true});
      break;
    case 'update_state':
      newState = Object.assign({}, state, action.new_state);
      break;
    case 'increment_strike':
      newState = Object.assign({}, state, {strikeCount: action.strikeCount});
      socket.emit('trigger strike', action.strikeCount);
      break;
    case 'reveal_answer':
      newState = Object.assign({}, state, {});
      newState.revealedAnswers = [...state.revealedAnswers, action.answer];
      socket.emit('update game', newState);
      break;
  }
  return newState;
}

var store = createStore(reducer, initialState);

//Pass initial state to game as props
var GameState = function(state) {
  return{
    strikeCount: state.strikeCount,
    judge: state.judge,
    beginGame: state.beginGame,
    keys: state.keys,
    currentQuestion: state.currentQuestion,
    url: state.url,
    data: state.data,
    revealedAnswers: state.revealedAnswers
  }
}

var GameDispatch = function(dispatch) {
  return {
    setQuestions: function(data, keys) {
      dispatch({
        type: 'set_questions',
        data: data,
        keys: keys
      });
    },
    advanceQuestion: function(){
      dispatch({
        type: 'advance_question'
      });
    },
    startPlay: function() {
      dispatch({
        type: 'start_play'
      });
    },
    becomeJudge: function() {
      dispatch({
        type: 'become_judge'
      });
    },
    updateState: function(new_state) {
      dispatch({
        type: 'update_state',
        new_state: new_state
      });
    },
    incrementStrikeCount: function(count) {
      dispatch({
        type: 'increment_strike',
        strikeCount: count
      });
    },
    addRevealedAnswer: function(answer) {
      dispatch({
        type: 'reveal_answer',
        answer: answer
      });
    }
  }
}

StartPage = connect(
  GameState,
  GameDispatch
)(StartPage)
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
      <StartPage/>
  </Provider>,
  document.getElementById('content')
);
