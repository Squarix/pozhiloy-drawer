import React, { Component } from 'react';
import './App.css';

const inputTypes = Object.freeze({ text: 'textInput', file: 'fileContent' });

const fillText = (canvas, x, y, symbol) => {
  // console.log(canvas);
  canvas.getContext("2d").fillText(symbol, x, y, 10);
};

const objectMapper = {
  C: {
    type: 'element',
    func: args => {
      const [width, height] = args;
      const canvas = document.createElement('canvas');

      canvas.width = (Number.parseInt(width) + 1) * 10;
      canvas.height = (Number.parseInt(height) + 1) * 10;

      Object.defineProperty(canvas, 'metaObject', { value: [], writable: false });

      return canvas;
    }
  },
  L: {
    type: 'shape',
    func: (canvas, args) => {
      const [x, y, x1, y1] = args;
      canvas.metaObject.push = [{ type: 'L', coordinates: args }];

      if (x === x1) {
        const [yFrom, yTo] = y1 > y ? [y * 10, y1 * 10] : [y1 * 10, y * 10];
        for (let i = yFrom; i <= yTo; i += 10) {
          fillText(canvas, x * 10, i, 'x');
        }
      } else if (y === y1) {
        const [xFrom, xTo] = x1 > x ? [x * 10, x1 * 10] : [x1 * 10, x * 10];
        for (let i = xFrom; i <= xTo; i += 10) {
          fillText(canvas, i, y * 10, 'x');
        }
      } else {
        alert('Line is not supported');
      }
    },
  },
  R: {
    type: 'shape',
    func: (canvas, args) => {
      const [x, y, x1, y1] = args;

      const [xFrom, xTo] = x1 > x ? [x * 10, x1 * 10] : [x1 * 10, x * 10];
      const [yFrom, yTo] = y1 > y ? [y * 10, y1 * 10] : [y1 * 10, y * 10];

      canvas.metaObject.push = [{ type: 'R', coordinates: args, height: yTo / 10 - yFrom / 10, width: xTo / 10 - xFrom / 10 }];

      // for (let i = xFrom + 10; i < xTo; i += 10) {
      //   for (let j = yFrom + 10; j < yTo; j += 10) {
      //     fillText(canvas, i, j, ' ');
      //   }
      // }

      for (const x of [xFrom, xTo]) {
        for (let i = yFrom + 10; i < yTo; i += 10) {
          fillText(canvas, x, i, 'x');
        }
      }

      for (const y of [yFrom, yTo]) {
        for (let i = xFrom; i <= xTo; i += 10) {
          fillText(canvas, i, y, 'x');
        }
      }
    }
  },
  B: {
    type: 'fill',
    func: (canvas, args) => {
      const [xB, yB, c] = args;

      let fillableShape = null;

      const drawObjects = [];
      canvas.metaObject.forEach(object => {
        const [x, y, x1, y1] = object.coordinates;

        const [xFrom, xTo] = x1 > x ? [x * 10, x1 * 10] : [x1 * 10, x * 10];
        const [yFrom, yTo] = y1 > y ? [y * 10, y1 * 10] : [y1 * 10, y * 10];

        if (xB >= xFrom && xB <= xTo && yB >= yFrom && yB <= yTo) {
          drawObjects.push(object);
        }
      })

      if (drawObjects.length > 1) {
        let prevObject = drawObjects[0];
        for (let i = 1; i < drawObjects.length; i++) {
          const [x1, y1, x2, y2] = prevObject.coordinates;
          const [x3, y3, x4, y4] = drawObjects[i].coordinates;

          const left = Math.max(x1, x3);
          const right = Math.min(x2, x4);

          const top = Math.min(y2, y4);
          const bottom = Math.max(y1, y3);

          prevObject = { coordinates: [left, bottom, right, top] };
        }

        fillableShape = prevObject;
      }

      if (fillableShape) {
        const [ xF, yF, xF1, yF1 ] = fillableShape.coordinates;
        for (const x of [xF * 10, xF1 * 10]) {
          for (let i = yF * 10; i < yF1 * 10; i += 10) {
            fillText(canvas, x, i, c);
          }
        }

        for (const y of [yF * 10, yF1 * 10]) {
          for (let i = xF * 10; i < xF1; i += 10) {
            fillText(canvas, i, y, c);
          }
        }
      } else {
        const { width, height } = canvas.getBoundingClientRect();
        for (let i = 0; i < width; i += 10) {
          for (let j = 0; j < height; j += 10) {
            canvas.metaObject.forEach(obj => {
              const [x, y, x1, y1] = obj.coordinates;

              if (i >= x * 10 && i <= x1 * 10 && j >= y * 10 && j <= y1 * 10) {
                i += obj.width;
                j += obj.height;
              } else {
                fillText(canvas, i, j, c);
              }
            })
          }
        }
      }
    }
  }
}

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

  onInput = ({ target: { name, value } }) => {
    this.setState({
      [name]: value,
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
      let canvas = null;
      const rows = content.split('\n');
      rows.forEach(row => {
        const args = row.split(' ').filter(arg => arg);
        const command = args.shift();

        if (command === 'C') {
          canvas = objectMapper.C.func(args);
        } else if (canvas && command) {
          objectMapper[command].func(canvas, args);
        }
      });

      this.setState({ canvas });
    }
  }

  render() {
    const { fileUploading, canvas } = this.state;
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
          <div className="canvas" ref={element => this.handleCanvasRef(element, canvas)} />
        </div>
      </div>
    );
  }
}

export default App;
