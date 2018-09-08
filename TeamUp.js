import React from 'react';
import { Image, TextInput } from 'react-native';

TELEPOHNE_LENGTH = 7; // 番号の桁数
DELIMITER_INDEX = [1,2,3]; // ハイフンを入れる位置

export default class TeamUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      teamNumberForUI:null,
      teamNumber:null
    }
  }

  insertDelimiter(text) {
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

  componentWillMount(){
    console.log('componentWillMount')
    console.log(this.state.teamNumber)
  }

  componentWillUpdate(){
    console.log('componentWillUpdate')
    console.log(this.state.teamNumber)
    console.log(this.deleteDelimiter(this.state.teamNumber))
  }
  render() {
    return (
      <TextInput
        autoFocus={true}
        keyboardType={'number-pad'}
        value={this.state.teamNumber}
        placeholder="1-2-3-4"
        maxLength={TELEPOHNE_LENGTH}
        style={{
          fontSize: 35,
          fontWeight: 'bold',
          padding: 30
        }}
        onChangeText={text => {
          this.setState({
            teamNumber: this.insertDelimiter(text),
          })
        }}
      />
    );
  }
}
