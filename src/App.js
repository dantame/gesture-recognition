import React from 'react';
import * as handTrack from 'handtrackjs';
import {Howl, Howler} from 'howler';
import './App.css';

const modelParams = {
    flipHorizontal: true,   // flip e.g for video
    maxNumBoxes: 1,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.85,    // confidence threshold for predictions.
};

const sounds = {
  N: new Howl({src: 'clip1.mp3'}),
  S: new Howl({src: 'clip2.mp3'}),
  E: new Howl({src: 'clip3.mp3'}),
  W: new Howl({src: 'clip4.mp3'})
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();

    this.state = {
      rafId: -1,
      model: {},
      context: null,
      prevCoord: 0
    }
  }

  componentDidMount() {
    handTrack.load(modelParams).then(model => {
      console.log("model loaded");
      this.setState({ model });
    });
    this.setState({
      context: this.canvasRef.current.getContext('2d')
    })
  }

  startVideo = () => {
    handTrack.startVideo(this.videoRef.current).then((status) => {
      if (status) this.runDetection(this.state.model, this.videoRef.current);
    });
  }

  stopVideo = () => {
    handTrack.stopVideo(this.videoRef.current);
    cancelAnimationFrame(this.state.rafId)
  }

  getDirectionFromVector = (x, y, prevX, prevY) => {
    if (!x || !y) return;

    const absPrevY = Math.abs(prevY)
    const absY = Math.abs(y)
    const absPrevX = Math.abs(prevX)
    const absX = Math.abs(x)

    if (absY - absPrevY < -20) {
      return "N"
    }
    if (absY - absPrevY > 20) {
      return "S"
    }
    if (absX - absPrevX < -20) {
      return "E"
    }
    if (absX - absPrevX > 20) {
      return "W"
    }
  }

  runDetection = (model, video) => {
    model.detect(video).then(predictions => {
      console.log('Predictions: ', predictions);
      const { context, prevX, prevY } = this.state;
      model.renderPredictions(predictions, this.canvasRef.current, context, this.videoRef.current);
      const x = predictions && predictions[0] && predictions[0].bbox[0];
      const y = predictions && predictions[0] && predictions[0].bbox[1];
      const direction = this.getDirectionFromVector(x, y, prevX, prevY);

      if (sounds[direction] && !sounds[direction].playing()) {
        sounds[direction].play()
      }

      const rafId = requestAnimationFrame(() => this.runDetection(model, video));
      this.setState({rafId, prevX: x || prevX, prevY: y || prevY});

    });
  }

  render(){
    return (
      <div className="App">
        <video style={{display: 'none'}} ref={this.videoRef} />
        <canvas ref={this.canvasRef} />
        <br />
        <button onClick={this.startVideo}>Start Video</button>
        <button onClick={this.stopVideo}>Stop Video</button>
      </div>
    );
  }
}

export default App;
