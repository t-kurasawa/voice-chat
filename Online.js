'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Button,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  ListView,
  Platform,
} from 'react-native';
import io from 'socket.io-client';

import { Actions } from 'react-native-router-flux';

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';

export default class Online extends React.Component{
  socket = io.connect('https://react-native-webrtc.herokuapp.com', {transports: ['websocket']});
  configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

  pcPeers = {};
  localStream;
  container;
  
  constructor(props) {
    super(props);
    this.state = {
      info: 'Initializing',
      status: 'init',
      roomID: '',
      isFront: true,
      selfViewSrc: null,
      remoteList: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: '',
    };
  }

  componentWillMount() {
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => true});
  }

  componentDidMount() {
    console.log('componentDidMount()')
    // container = this;
  }
  _press = (event) => {
    this.refs.roomID.blur();
    this.setState({status: 'connect', info: 'Connecting'});
    this.join(this.state.roomID);
  }
  _switchVideoType = () => {
    const isFront = !this.state.isFront;
    this.setState({isFront});
    this.getLocalStream(isFront, (stream) => {
      if (this.localStream) {
        for (const id in this.pcPeers) {
          const pc = this.pcPeers[id];
          pc && pc.removeStream(this.localStream);
        }
        this.localStream.release();
      }
      this.localStream = stream;
      // container.setState({selfViewSrc: stream.toURL()});
      this.setState({selfViewSrc: stream.toURL()});

      for (const id in this.pcPeers) {
        const pc = this.pcPeers[id];
        pc && pc.addStream(this.localStream);
      }
    });
  }
  receiveTextData = (data) => {
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push(data);
    this.setState({textRoomData, textRoomValue: ''});
  }
  _textRoomPress = () => {
    if (!this.state.textRoomValue) {
      return
    }
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push({user: 'Me', message: this.state.textRoomValue});
    for (const key in this.pcPeers) {
      const pc = this.pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({textRoomData, textRoomValue: ''});
  }
  _renderTextRoom = () => {
    return (
      <View style={styles.listViewContainer}>
        <ListView
          dataSource={this.ds.cloneWithRows(this.state.textRoomData)}
          renderRow={rowData => <Text>{`${rowData.user}: ${rowData.message}`}</Text>}
          />
        <TextInput
          style={{width: 200, height: 30, borderColor: 'gray', borderWidth: 1}}
          onChangeText={value => this.setState({textRoomValue: value})}
          value={this.state.textRoomValue}
        />
        <TouchableHighlight
          onPress={this._textRoomPress}>
          <Text>Send</Text>
        </TouchableHighlight>
      </View>
    );
  }

  logError = (error) => {
    console.log("logError", error);
  }
  
  mapHash = (hash, func) => {
    const array = [];
    for (const key in hash) {
      const obj = hash[key];
      array.push(func(obj, key));
    }
    return array;
  }
  
  getStats = () => {
    const pc = this.pcPeers[Object.keys(this.pcPeers)[0]];
    if (pc.getRemoteStreams()[0] && pc.getRemoteStreams()[0].getAudioTracks()[0]) {
      const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
      console.log('track', track);
      pc.getStats(track, (report) => {
        console.log('getStats report', report);
      }, this.logError);
    }
  }

  getLocalStream = (isFront, callback) => {

    let videoSourceId;
  
    // on android, you don't have to specify sourceId manually, just use facingMode
    // uncomment it if you want to specify
    if (Platform.OS === 'ios') {
      MediaStreamTrack.getSources(sourceInfos => {
        console.log("sourceInfos: ", sourceInfos);
  
        for (const i = 0; i < sourceInfos.length; i++) {
          const sourceInfo = sourceInfos[i];
          if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
            videoSourceId = sourceInfo.id;
          }
        }
      });
    }
    getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 640, // Provide your own width, height and frame rate here
          minHeight: 360,
          minFrameRate: 30,
        },
        facingMode: (isFront ? "user" : "environment"),
        optional: (videoSourceId ? [{sourceId: videoSourceId}] : []),
      }
    }, (stream) => {
      console.log('getUserMedia success', stream);
      callback(stream);
    }, this.logError);
  }

  join = (roomID) => {
    this.socket.emit('join', roomID, (socketIds) => {
      console.log('join', socketIds);
      for (const i in socketIds) {
        const socketId = socketIds[i];
        this.createPC(socketId, true);
      }
    });
  }

  exchange = (data) => {
    const fromId = data.from;
    let pc;
    if (fromId in this.pcPeers) {
      pc = this.pcPeers[fromId];
    } else {
      pc = this.createPC(fromId, false);
    }
  
    if (data.sdp) {
      console.log('exchange sdp', data);
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp), () => {
        if (pc.remoteDescription.type == "offer")
          pc.createAnswer((desc) => {
            console.log('createAnswer', desc);
            pc.setLocalDescription(desc, () => {
              console.log('setLocalDescription', pc.localDescription);
              this.socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
            }, this.logError);
          }, this.logError);
      }, this.logError);
    } else {
      console.log('exchange candidate', data);
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
  

  createPC = (socketId, isOffer) => {
    console.log('createPC')
    const pc = new RTCPeerConnection(this.configuration);
    this.pcPeers[socketId] = pc;
  
    pc.onicecandidate = (event) => {
      console.log('onicecandidate', event.candidate);
      if (event.candidate) {
        this.socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
      }
    };
  
    const createOffer = () => {
      console.log('createOffer');
      pc.createOffer((desc) => {
        console.log('pc.createOffer', desc);
        pc.setLocalDescription(desc, () => {
          console.log('setLocalDescription', pc.localDescription);
          this.socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
        }, this.logError);
      }, this.logError);
    }
  
    pc.onnegotiationneeded = () => {
      console.log('onnegotiationneeded');
      if (isOffer) {
        console.log('isOffer');
        createOffer();
      }
    }
  
    pc.oniceconnectionstatechange = (event) => {
      console.log('oniceconnectionstatechange', event.target.iceConnectionState);
      if (event.target.iceConnectionState === 'completed') {
        setTimeout(() => {
          this.getStats();
        }, 1000);
      }
      if (event.target.iceConnectionState === 'connected') {
        createDataChannel();
      }
    };
    pc.onsignalingstatechange = (event) => {
      console.log('onsignalingstatechange', event.target.signalingState);
    };
  
    pc.onaddstream = (event) => {
      console.log('onaddstream', event.stream);
      // container.setState({info: 'One peer join!'});
      this.setState({info: 'One peer join!'});
  
      // const remoteList = container.state.remoteList;
      const remoteList = this.state.remoteList;
      remoteList[socketId] = event.stream.toURL();
      // container.setState({ remoteList: remoteList });
      this.setState({ remoteList: remoteList });
    };
    pc.onremovestream = (event) => {
      console.log('onremovestream', event.stream);
    };
  
    pc.addStream(this.localStream);
    const createDataChannel = () => {
      if (pc.textDataChannel) {
        return;
      }
      const dataChannel = pc.createDataChannel("text");
  
      dataChannel.onerror = (error) => {
        console.log("dataChannel.onerror", error);
      };
  
      dataChannel.onmessage = (event) => {
        console.log("dataChannel.onmessage:", event.data);
        // container.receiveTextData({user: socketId, message: event.data});
        this.receiveTextData({user: socketId, message: event.data});
      };
  
      dataChannel.onopen = () => {
        console.log('dataChannel.onopen');
        // container.setState({textRoomConnected: true});
        this.setState({textRoomConnected: true});
      };
  
      dataChannel.onclose = () => {
        console.log("dataChannel.onclose");
      };
  
      pc.textDataChannel = dataChannel;
    }
    return pc;
  }

  leave = (socketId) => {
    console.log('leave', socketId);
    const pc = this.pcPeers[socketId];
    const viewIndex = pc.viewIndex; //TODO: bug
    pc.close();
    delete this.pcPeers[socketId];
  
    // const remoteList = container.state.remoteList;
    const remoteList = this.state.remoteList;
    delete remoteList[socketId]
    // container.setState({ remoteList: remoteList });
    this.setState({ remoteList: remoteList });
    // container.setState({info: 'One peer leave!'});
    this.setState({info: 'One peer leave!'});
  }
  
  
  render() {
    console.log('render()')
    console.log(this.state)

    this.socket.on('exchange', (data) => {
      this.exchange(data);
    });
    this.socket.on('leave', (socketId) =>{
      this.leave(socketId);
    });    
    this.socket.on('connect', (data) => {
      console.log('connect');
      this.getLocalStream(true, (stream) => {
        this.localStream = stream;
        // container.setState({selfViewSrc: stream.toURL()});
        // TODO: React.Component の中では無いので this.setState が使えない（thisに存在しない）
        this.setState({selfViewSrc: stream.toURL()});
        // container.setState({status: 'ready', info: 'Please enter or create room ID'});
        this.setState({status: 'ready', info: 'Please enter or create room ID'});
      });
    });
    
    return (
      <View style={styles.container}>
        <Button
          title = 'TeamUp'
          onPress = {() => Actions.TeamUp()}
        />
        <Text>{this.props.teamNumber}</Text>
        <Text style={styles.welcome}>
          {this.state.info}
        </Text>
        {this.state.textRoomConnected && this._renderTextRoom()}
        <View style={{flexDirection: 'row'}}>
          <Text>
            {this.state.isFront ? "Use front camera" : "Use back camera"}
          </Text>
          <TouchableHighlight
            style={{borderWidth: 1, borderColor: 'black'}}
            onPress={this._switchVideoType}>
            <Text>Switch camera</Text>
          </TouchableHighlight>
        </View>
        { this.state.status == 'ready' ?
          (<View>
            <TextInput
              ref='roomID'
              autoCorrect={false}
              style={{width: 200, height: 40, borderColor: 'gray', borderWidth: 1}}
              onChangeText={(text) => this.setState({roomID: text})}
              value={this.state.roomID}
            />
            <TouchableHighlight
              onPress={this._press}>
              <Text>Enter room</Text>
            </TouchableHighlight>
          </View>) : null
        }
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}/>
        {
          this.mapHash(this.state.remoteList, (remote, index) => {
            return <RTCView key={index} streamURL={remote} style={styles.remoteView}/>
          })
        }
      </View>
    );
  }
};

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: 200,
    height: 150,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  listViewContainer: {
    height: 150,
  },
});

AppRegistry.registerComponent('Online', () => Online);