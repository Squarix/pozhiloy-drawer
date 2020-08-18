import React, { Component } from 'react';
import './App.css';

import { commandsMapper, inputTypes } from "./App.helper";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      textInput: "",
      fileContent: "",
      fileUploading: false,
      lastInput: null,
      canvas: ''
    }
  }

  onInput = ({ target: { value } }) => {
    this.setState({
      textInput: value,
      lastInput: inputTypes.text
    });
  }

  handleCanvasRef = (element, canvas) => {
    if (element?.lastElementChild) {
      element.removeChild(element.lastElementChild);
    }

    if (element && canvas) {
      element.appendChild(canvas)
    }
  }

  onFileUpload = ({ target }) => {
    if (target.files[0]) {
      this.setState({ fileUploading: true });

      const fileReader = new FileReader();
      fileReader.onload = async ({ target: { result } }) => {
        this.setState({ lastInput: inputTypes.file, fileContent: result, fileUploading: false })
      };

      fileReader.readAsText(target.files[0]);
    }
  }

  exportTxt = () => {
    const { canvas: { textCanvas, originalWidth, originalHeight } } = this.state;
    for (let i = 0; i < originalWidth + 1; i++) {
      textCanvas[0][i] = '-';
      textCanvas[textCanvas.length - 1][i] = '-';
    }

    for (let i = 1; i < originalHeight + 1; i++) {
      textCanvas[i][0] = '|';
      textCanvas[i][originalWidth] = '|';
    }

    const text = textCanvas.map(row => {
      let string = '';
      for (let i = 0; i < row.length; i++) {
        string += row[i] || ' ';
      }

      return string;
    }).join('\n');

    const data = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');

    document.body.appendChild(a);
    a.href = window.URL.createObjectURL(data);
    a.download = 'output.txt';
    a.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }, 0)
  };

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
      let canvas = null;
      const rows = content.split('\n');
      rows.forEach(row => {
        const args = row.split(' ').map(arg => {
          if (!isNaN(arg)) {
            return Number.parseInt(arg);
          }

          return arg;
        }).filter(arg => arg);
        const command = args.shift();

        if (command === 'C') {
          canvas = commandsMapper.C.func(args);
        } else if (canvas && command) {
          commandsMapper[command].func(canvas, args);
        }
      });

      this.setState({ canvas });
    }
  }

  render() {
    const { fileUploading, canvas, fileContent } = this.state;
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
              {fileContent ? 'Change file' : 'Upload file'}
            </label>
          </div>
          <div className="action-buttons">
            <div className="draw-button">
              <button name="textInput" onClick={this.draw} disabled={fileUploading}>Draw</button>
              <button name="exportTxt" onClick={this.exportTxt} disabled={!canvas}>Export</button>
            </div>
          </div>
          <div className="canvas" ref={element => this.handleCanvasRef(element, canvas)}/>
        </div>
      </div>
    );
  }
}

export default App;
