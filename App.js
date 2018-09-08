import React from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';
import TeamUp from './TeamUp.js'

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>４桁のチームナンバーを入れてください</Text>
        <TeamUp></TeamUp>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent('App', () => App);
