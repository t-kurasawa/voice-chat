import React from 'react';
import { Button, Text, View } from 'react-native';

import { Actions } from 'react-native-router-flux';

export default class Online extends React.Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  render() {
    return (
      <View>
        <Button
          title = 'TeamUp'
          onPress = {() => Actions.TeamUp()}
        />
        <Text>{this.props.teamNumber}</Text>
      </View>
    );
  }
}