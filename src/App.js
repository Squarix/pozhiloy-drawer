import React, { Component } from 'react';
import './App.css';

const inputTypes = Object.freeze({ text: 'textInput', file: 'fileContent' });
const objectMapper = {
  C: {
    type: 'element',
    tag: 'canvas'
  },
  L: {
    type: 'shape',
    func: (canvas, args) => {
      const [x, y, x1, y1] = args;
      canvas.fillText()
    },
  },
  R: {
    type: 'shape'
  },
  B: {
    type: 'shape'
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      textInput: "",
      fileContent: "",
      fileUploading: false,
      lastInput: null
    }
  }

  onInput = ({ target: { name, value } }) => {
    this.setState({
      [name]: value,
      lastInput: inputTypes.text
    });
  }

  onFileUpload = ({ target }) => {
    this.setState({ fileUploading: true });

    const fileReader = new FileReader();
    fileReader.onload = async ({ target: { result}}) => {
      this.setState({ lastInput: inputTypes.file, fileContent: result, fileUploading: false })
    };

    fileReader.readAsText(target.files[0]);
  }

  draw = () => {
    const { lastInput, fileContent, textInput } = this.state;
    let content;
    switch (lastInput) {
      case inputTypes.file: {
        content = fileContent;
        break;
      }
      case inputTypes.text: {
        content = textInput;
        break;
      }
      default:
        break;
    }

    if (content) {
      const rows = content.split('\n');
    }
  }

  render() {
    const { fileUploading } = this.state;
    return (
      <div className="App">
        <div className="upload-container">
          <div className="text-input">
            <textarea placeholder="Provide some text" onChange={this.onInput}/>
          </div>
          <div className="or-subtitle">OR</div>
          <div className="file-input">
            <label className="file-upload">
              <input type="file" onChange={this.onFileUpload} accept=".txt"/>
              Custom Upload
            </label>
          </div>
          <div className="draw-button">
            <button name="textInput" onClick={this.draw} disabled={fileUploading}>Draw</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
