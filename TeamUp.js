import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Actions } from 'react-native-router-flux';

TELEPOHNE_LENGTH = 7; // 番号の桁数
DELIMITER_INDEX = [1,2,3]; // ハイフンを入れる位置

export default class TeamUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      teamNumber:null
    }
  }

  insertDelimiter(text) {
    //TODO: 直したい
    let text_without_delimiter = text.replace(/-/g, '');
    let result = text_without_delimiter;
    DELIMITER_INDEX.forEach(function(value, index) {
      if (text_without_delimiter.length >= value) {
        const insertIndex = value + index;
        result = `${result.slice(0, insertIndex)}-${result.slice(
          insertIndex,
          insertIndex + result.length
        )}`;
        index++;
      }
    });
    return result;
  }

  deleteDelimiter(text){
    return (text)?text.replace(/-/g, ''):null;
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>４桁のチームナンバーを入れてください</Text>
        <TextInput
          autoFocus={true}
          keyboardType={'number-pad'}
          value={this.state.teamNumber}
          placeholder="1-2-3-4"
          maxLength={TELEPOHNE_LENGTH}
          style={styles.textinput}
          onChangeText={text => {
            this.setState({
              teamNumber: this.insertDelimiter(text),
            })
          }}
        />
        <Button
          title = 'Online'
          style={styles.button}
          onPress = {() => Actions.Online({teamNumber: this.deleteDelimiter(this.state.teamNumber)})}
        />
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
  textinput:{
    fontSize: 35,
    fontWeight: 'bold',
    padding: 30
  },
  button: {}
});
