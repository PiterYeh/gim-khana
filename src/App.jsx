import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css';

import React from 'react';
import PageExercises from './Pages/Exercises.jsx';
import PageIndex from './Pages/Index.jsx';
import PageRoutines from './Pages/Routines.jsx';
import PageRoutineConfig from './Pages/RoutineConfig.jsx';
import { translations, getTranslation, context as Context } from './Translations';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  withRouter
} from "react-router-dom";

class NavWithoutRouter extends React.Component {
  static contextType = Context;

  paths = {
    '/exercises': {
      prev: '/',
      title: this.context('titleExercises')
    },
    '/routines': {
      prev: '/',
      title: this.context('titleMyRoutines')
    },
    '/routine-config': {
      prev: '/',
      title: this.context('titleMyRoutines')
    },
    '/routines/:key/config': {
      prev: '/',
      title: 'yo'
    }
  }

  render() {
    var history = this.props.history;
    var config = this.getConfig(history.location.pathname);
    if(config == null)
      return null;
    return (
      <nav className="gk-fix-fixed gk-fix gk-fix-row">
        <button className="btn btn-outline-secondary nav-back gk-fix-fixed" style={{ borderRadius: 100 }} onClick={history.push.bind(history, config.prev, {})}>
          <i className="fa fa-arrow-left" />
        </button>
        <div className="nav-title gk-fix-content">{config.title}</div>
      </nav>
    );
  }

  getConfig(path) {
    var tokens = path.split('/');
    for(let key in this.paths) {
      var tokensI = key.split('/');
      if(tokens.length !== tokensI.length)
        continue;
      var match = true;
      for(let i = 0; i < tokens.length && match; ++i) {
        if(tokensI[i][0] !== ':' && tokens[i] !== tokensI[i])
          match = false;
      }
      if(match)
        return this.paths[key];
    }
    return null;
  }
}
const Nav = withRouter(NavWithoutRouter);

class App extends React.Component {
  state = {
    translations: translations.it
  };

  getTranslation(name) {
    return getTranslation(this.state.translations, name);
  }

  setLanguage(name) {
    var langTranslations = translations[name];
    if(name == null)
      throw new Error(`language not found: ${name}`);
    this.setState({
      translations: langTranslations
    });
  }

  render() {
    return (
      <Context.Provider value={this.getTranslation.bind(this)}>
        <Router>
          <Nav />
          <main className="gk-fix-content">
            <Switch>
              <Route path="/exercises" component={PageExercises} />
              <Route path="/routines/:key/config" component={PageRoutineConfig} />
              <Route path="/routines" component={PageRoutines} />
              <Route path="/" component={PageIndex} />
            </Switch>
          </main>
        </Router>
      </Context.Provider>
    );
  }
}

export default App;