let StartPage = React.createClass({
  loginJudge: function () {
    let becomeJudge = this.props.becomeJudge;
    $('#judgeLogin').show();
    $('#submitJudgeLogin').on('click', function(){
      if ($('#judgeName').val() == 'judge' && $('#judgePass').val() == 'P4ssword') {
        becomeJudge();
        alert("Judge authenticated; play when ready");
      }
      $('#judgeLogin').hide();
    });
  },
  setUpGame: function () {
    $('#judgeLogin').hide();
    let game_length = $('input[name=length]:checked').val();
    this.props.startPlay(game_length);
  },
  render: function () {
    let self = this;
    socket.on('update game', function (data) {
      self.props.updateState(Object.assign({}, data, {judge: self.props.judge}));
    });
    let play = this.props.beginGame;
    let content = play ? <Game /> : <div><p>Welcome!</p><p>What length of game do you want to play?</p><input type="radio" name="length" value='0' checked="checked"> All </input><br/>
    <input type="radio" name="length" value='3'> Short </input><br/>
  <input type="radio" name='length' value="4"> Medium </input><br/>
  <input type="radio" name='length' value="5"> Long </input><br/><br/><button onClick={this.loginJudge}> Judge Login </button><button className="play" onClick={this.setUpGame}> Play! </button></div>;
    return (
      <div>
        {content}
        <div id="judgeLogin">
          <h2>Login</h2>
          <input id="judgeName" name="user_name" placeholder="User Name" type="text"/>
          <input id="judgePass" name="password" type="password"/>
          <button id="submitJudgeLogin"> Submit </button>
        </div>
      </div>
    )
  }
});

let Game = React.createClass({
  loadQuestionsFromJson: function () {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.sortQuestions (data);
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function () {
    this.loadQuestionsFromJson();
  },
  sortQuestions: function (data) {
    var key_array = [];
    var new_key_array = [];
    var old_key_array = [];
    for (var question in data) {
      key_array.push([question, data[question]["counter"]]);
    }
    key_array.sort(function (a, b) {return a[1] - b[1]});
    var lower_number = key_array[0][1];
    let shuffled = key_array.slice(0), i = key_array.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    //randomize, then pass to lower number array or higher number array
    shuffled.forEach(function(key){
      if (key[1] === lower_number) {
        new_key_array.push(key);
      }else{
        old_key_array.push(key);
      }
    });
    this.props.setQuestions(data, new_key_array, old_key_array);
  },
  triggerStrike: function () {
    this.props.incrementStrikeCount(this.props.strikeCount + 1);
  },
  nextQuestion: function () {
    if (this.props.gameLength != 0 && (this.props.currentQuestion) == this.props.gameLength) {
      this.props.endGame();
    } else {
      this.props.hideAnswers(this.props.advanceQuestion);
    }
  },
  render: function () {
    var next_question = this.props.keysNew[this.props.currentQuestion + 1] || this.props.keysOld[0]
    return(
      <div>
        {this.props.keysNew.length &&
          <div>
            <header><h1>{this.props.keysNew[this.props.currentQuestion][0].replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })}</h1></header>

            <AnswerSection />

            <section className="strikes">
            	<div className="one-strike">☒</div>
            	<div className="two-strikes">☒☒</div>
            	<div className="three-strikes">☒☒☒</div>
            </section>

            {this.props.judge &&
              <div>
                <button onClick={this.triggerStrike}> Wrong! </button>
                <button className="next" onClick={this.nextQuestion}> Next Question </button>
                <div>{next_question[0].replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })}</div>
              </div>
            }
          </div>
        }
      </div>
    );
  }
});

let AnswerContainer = React.createClass({
  emitRevealAnswer: function (e) {
    if (this.props.judge) {
      if (this.props.revealedAnswers.length === 0 ) {
        this.writeToJSON();
      }
      this.props.addRevealedAnswer(this.props.index);
    }
  },
  writeToJSON: function () {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: {question: this.props.keysNew[this.props.currentQuestion][0]},
      success: function(data) {
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function () {
    let reveal = '';
    let clicked = false;
    let index = this.props.index;
    this.props.revealedAnswers.forEach(function (revealed) {
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
          <div className='front face'><span>{index}</span></div>
          <div className='back face'>
            <span className='answer'>{this.props.answer}</span>
            <span className='points'>{this.props.count}</span>
          </div>
        </div>
      </div>
    );
  }
});

let AnswerSection = React.createClass({
  calculateContainers: function () {
    let containers = [];
    let blank_counter = 0;

    if (this.props.keysNew.length != 0) {
      $.each(this.props.data[this.props.keysNew[this.props.currentQuestion][0]].answers, function (i, value) {
        let answer = value[0];
        let count = value[1];
        containers.push(<AnswerContainer key={i} index={i+1} answer={answer} count={count}/>);
      });
    }

    while (containers.length < 10) {
      containers.push(<div className="flip-container blank" key={"b" + blank_counter}></div>);
      blank_counter ++;
    }

    var divided_containers =<div><div className='first_half' key="1" >{containers.slice(0, 5)}</div><div className='second_half' key="2" >{containers.slice(5, 10)}</div></div>

    return divided_containers;
  },
  render: function () {
    return(
      <section className='answers'>
        {this.calculateContainers()}
      </section>
    );
  }

});

//createStore, provider, and set initial State
let createStore = Redux.createStore;
let Provider = ReactRedux.Provider;
let connect = ReactRedux.connect;

let initialState = {
  gameLength: 0,
  currentQuestion: 0,
  strikeCount: 0,
  judge: false,
  beginGame: false,
  keysNew: [],
  keysUsed: [],
  keysOld: [],
  data: {},
  url: '/api/feud-data',
  revealedAnswers: []
}

let reducer = function (state, action) {
  if (state === undefined) {
    return initialState;
  }
  let newState = state;

  switch (action.type) {
    case 'set_questions':
      newState = Object.assign({}, state, {data: action.data, keysNew: action.new_keys, keysOld: action.old_keys});
      socket.emit('update game', newState);
      break;
    case 'advance_question':
      let nextQuestion = state.currentQuestion + 1;
      newState = Object.assign({}, state, {strikeCount: 0, currentQuestion: nextQuestion});
      if (!newState.keysNew[nextQuestion]) {
        nextQuestion = 0;
        newState.keysNew = newState.keysOld;
      }
      socket.emit('update game', newState);
      break;
    case 'hide_answers':
      newState = newState = Object.assign({}, state, {revealedAnswers: []});
      socket.emit('hide answers', newState);
      break;
    case 'start_play':
      newState = Object.assign({}, state, {beginGame: true, gameLength: action.game_length});
      break;
    case 'end_game' :
      newState = Object.assign({}, state, {beginGame: false, gameLength: 0, strikeCount: 0, revealedAnswers: []});
      socket.emit('update game', newState);
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
      socket.emit('trigger correct');
      socket.emit('update game', newState);
      break;
  }
  return newState;
}

let store = createStore(reducer, initialState);

//Pass initial state to game as props
let GameState = function (state) {
  return {
    gameLength: state.gameLength,
    strikeCount: state.strikeCount,
    judge: state.judge,
    beginGame: state.beginGame,
    keysNew: state.keysNew,
    keysOld: state.keysOld,
    currentQuestion: state.currentQuestion,
    url: state.url,
    data: state.data,
    revealedAnswers: state.revealedAnswers
  }
}

let GameDispatch = function (dispatch) {
  return {
    setQuestions: function (data, new_keys, old_keys) {
      dispatch({
        type: 'set_questions',
        data: data,
        new_keys: new_keys,
        old_keys: old_keys
      });
    },
    hideAnswers: function(callback) {
      function advanceQuestionCallback() {
        window.removeEventListener('transitionend', advanceQuestionCallback);
        callback();
      }
      window.addEventListener('transitionend', advanceQuestionCallback);

      dispatch({
        type: 'hide_answers'
      });
    },
    advanceQuestion: function () {
      dispatch({
        type: 'advance_question'
      });
    },
    startPlay: function (game_length) {
      dispatch({
        type: 'start_play',
        game_length: game_length
      });
    },
    becomeJudge: function () {
      dispatch({
        type: 'become_judge'
      });
    },
    updateState: function (new_state) {
      dispatch({
        type: 'update_state',
        new_state: new_state
      });
    },
    incrementStrikeCount: function (count) {
      dispatch({
        type: 'increment_strike',
        strikeCount: count
      });
    },
    addRevealedAnswer: function (answer) {
      dispatch({
        type: 'reveal_answer',
        answer: answer
      });
    },
    endGame: function() {
      dispatch({
        type: 'end_game'
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
