import React from 'react';
import { AppRegistry } from 'react-native';
import { Router, Scene } from 'react-native-router-flux';
import TeamUp from './TeamUp.js';
import Online from './Online.js';

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <Scene key="root">
          <Scene key="TeamUp"
            component={TeamUp}
            title = 'TeamUp'
            initial
          />
          <Scene key="Online"
            component={Online}
            title = 'Online'
          />
        </Scene>
      </Router>
    );
  }
}

AppRegistry.registerComponent('App', () => App);
