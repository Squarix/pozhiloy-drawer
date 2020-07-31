import React, { Component } from 'react';
import './App.css';

const inputTypes = Object.freeze({ text: 'textInput', file: 'fileContent' });

const SCALE = 10
const fillText = (canvas, x, y, symbol) => {
  canvas.getContext("2d").fillText(symbol, (x - 1) * SCALE, y * SCALE, SCALE);
};

const neighbours = (args, line) => {
  let [ x, y, x1, y1 ] = args;

  // In fact, our lines can not intercept, but they lay close and create a closed loop (замкнутый контур)
  // * is points, that we need to check, - is original line
  // *******
  // *-----*
  // *******
  // I split these points on 4 lines and check if any other line intercepts them
  let l1, l2, l3, l4;
  if (x === x1) {
    l1 = [ x - 1, y, x1 - 1, y1 ];
    l2 = [ x + 1, y, x1 + 1, y1 ];
    l3 = [ x - 1, y - 1, x + 1, y - 1 ];
    l4 = [ x1 - 1, y1 + 1, x1 + 1, y1 + 1 ];
  } else if (y === y1) {
    l1 = [ x, y - 1, x1, y1 - 1 ];
    l2 = [ x, y + 1, x1, y1 + 1 ];
    l3 = [ x - 1, y - 1, x - 1, y + 1 ];
    l4 = [ x1 + 1, y1 - 1, x1 + 1, y1 + 1 ];
  } else {
    console.log('Line not supported');
    return false;
  }

  const intersections = [ l1, l2, l3, l4 ].map(l => {
    const [ x1, y1, x2, y2 ] = l;
    const [ x3, y3, x4, y4 ] = line;

    // Kramer
    const denominator = (y4 - y3) * (x1 - x2) - (x4 - x3) * (y1 - y2);
    if (denominator === 0) {
      return (
        (x1 * y2 - x2 * y1) * (x4 - x3) - (x3 * y4 - x4 * y3) * (x2 - x1) === 0 &&
        (x1 * y2 - x2 * y1) * (y4 - y3) - (x3 * y4 - x4 * y3) * (y2 - y1) === 0
      );
    } else {
      const numeratorA = (x4 - x2) * (y4 - y3) - (x4 - x3) * (y4 - y2);
      const numeratorB = (x1 - x2) * (y4 - y2) - (x4 - x2) * (y1 - y2);
      const Ua = numeratorA / denominator;
      const Ub = numeratorB / denominator;
      return Ua >= 0 && Ua <= 1 && Ub >= 0 && Ub <= 1;
    }
  });

  return intersections.filter(l => l).length > 0;
}

const objectMapper = {
  C: {
    type: 'element',
    func: args => {
      // Scale just for better appearance
      const [ width, height ] = args;
      const canvas = document.createElement('canvas');

      canvas.width = width * SCALE;
      canvas.height = height * SCALE;

      // information about drew objects
      Object.defineProperty(canvas, 'metaObject', { value: [], writable: false });

      return canvas;
    }
  },
  L: {
    type: 'shape',
    func: (canvas, args) => {
      const [ x, y, x1, y1 ] = args;
      canvas.metaObject.push({ type: 'L', coordinates: args });

      if (x === x1) {
        const [ yFrom, yTo ] = y1 > y ? [ y, y1 ] : [ y1, y ];
        for (let i = yFrom; i <= yTo; i++) {
          fillText(canvas, x, i, 'x');
        }
      } else if (y === y1) {
        const [ xFrom, xTo ] = x1 > x ? [ x, x1 ] : [ x1, x ];
        for (let i = xFrom; i <= xTo; i++) {
          fillText(canvas, i, y, 'x');
        }
      } else {
        alert('Line is not supported');
      }
    },
  },
  R: {
    type: 'shape',
    func: (canvas, args) => {
      const [ x, y, x1, y1 ] = args;

      const [ xFrom, xTo ] = x1 > x ? [ x, x1 ] : [ x1, x ];
      const [ yFrom, yTo ] = y1 > y ? [ y, y1 ] : [ y1, y ];

      canvas.metaObject.push({ type: 'R', coordinates: args, height: yTo - yFrom, width: xTo - xFrom });

      // for (let i = xFrom + 10; i < xTo; i += 10) {
      //   for (let j = yFrom + 10; j < yTo; j += 10) {
      //     fillText(canvas, i, j, ' ');
      //   }
      // }

      for (const x of [ xFrom, xTo ]) {
        for (let i = yFrom + 1; i < yTo; i++) {
          fillText(canvas, x, i, 'x');
        }
      }

      for (const y of [ yFrom, yTo ]) {
        for (let i = xFrom; i <= xTo; i++) {
          fillText(canvas, i, y, 'x');
        }
      }
    }
  },
  B: {
    type: 'fill',
    func: (canvas, args) => {
      const [ xB, yB, c ] = args;

      let fillableShape = null;

      const lines = [];

      // Take borders as lines in order to find closed loop
      lines.push({ type: 'L', coordinates: [ 0, 0, 0, canvas.height / SCALE ] });
      lines.push({ type: 'L', coordinates: [ 0, 0, canvas.width / SCALE, 0 ] });
      lines.push({ type: 'L', coordinates: [ 0, canvas.height / SCALE, canvas.width / SCALE, canvas.height / SCALE ] });
      lines.push({ type: 'L', coordinates: [ canvas.width / SCALE, 0, canvas.width / SCALE, canvas.height / SCALE ] });

      canvas.metaObject.forEach(object => {
        if (object.type === 'L') {
          lines.push(object);
        } else if (object.type === 'R') {
          const [ x1, y1, x2, y2 ] = object.coordinates;
          // Split rectangle in 4 lines ==> Just to make all elements same
          lines.push({ type: 'L', coordinates: [ x1, y1, x2, y1 ] });
          lines.push({ type: 'L', coordinates: [ x1, y1, x1, y2 ] });
          lines.push({ type: 'L', coordinates: [ x1, y2, x2, y2 ] });
          lines.push({ type: 'L', coordinates: [ x2, y1, x2, y2 ] });
        }
      });

      const nbHood = lines.map((line, index) => {
        return lines.map((l, i) => {
          if (i === index) return null;
          if (neighbours(line.coordinates, l.coordinates)) {
            return l;
          }

          return null;
        }).filter(l => l);
      });

      console.log(lines);
      console.log(nbHood);
      //
      // const drawObjects = [];
      // canvas.metaObject.forEach(object => {
      //   const [x, y, x1, y1] = object.coordinates;
      //
      //   const [xFrom, xTo] = x1 > x ? [x, x1] : [x1, x];
      //   const [yFrom, yTo] = y1 > y ? [y, y1] : [y1, y];
      //
      //   if (xB >= xFrom && xB <= xTo && yB >= yFrom && yB <= yTo) {
      //     drawObjects.push(object);
      //   }
      // })
      //
      // if (drawObjects.length > 1) {
      //   let prevObject = drawObjects[0];
      //   for (let i = 1; i < drawObjects.length; i++) {
      //     const [x1, y1, x2, y2] = prevObject.coordinates;
      //     const [x3, y3, x4, y4] = drawObjects[i].coordinates;
      //
      //     const left = Math.max(x1, x3);
      //     const right = Math.min(x2, x4);
      //
      //     const top = Math.min(y2, y4);
      //     const bottom = Math.max(y1, y3);
      //
      //     prevObject = { coordinates: [left, bottom, right, top] };
      //   }
      //
      //   fillableShape = prevObject;
      // }
      //
      // if (fillableShape) {
      //   const [ xF, yF, xF1, yF1 ] = fillableShape.coordinates;
      //   for (const x of [xF, xF1]) {
      //     for (let i = yF; i < yF1; i++) {
      //       fillText(canvas, x, i, c);
      //     }
      //   }
      //
      //   for (const y of [yF, yF1]) {
      //     for (let i = xF; i < xF1; i++) {
      //       fillText(canvas, i, y, c);
      //     }
      //   }
      // } else {
      //   const { width, height } = canvas.getBoundingClientRect();
      //   for (let i = 0; i < width; i++) {
      //     for (let j = 0; j < height; j++) {
      //       canvas.metaObject.forEach(obj => {
      //         const [x, y, x1, y1] = obj.coordinates;
      //
      //         if (i >= x && i <= x1 && j >= y && j <= y1) {
      //           i += obj.width;
      //           j += obj.height;
      //         } else {
      //           fillText(canvas, i, j, c);
      //         }
      //       })
      //     }
      //   }
      // }
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
    if (target.files[0]) {
      this.setState({ fileUploading: true });

      const fileReader = new FileReader();
      fileReader.onload = async ({ target: { result } }) => {
        this.setState({ lastInput: inputTypes.file, fileContent: result, fileUploading: false })
      };

      fileReader.readAsText(target.files[0]);
    }
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
        const args = row.split(' ').map(arg => {
          if (!isNaN(arg)) {
            return Number.parseInt(arg);
          }

          return arg;
        }).filter(arg => arg);
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
          <div className="canvas" ref={element => this.handleCanvasRef(element, canvas)}/>
        </div>
      </div>
    );
  }
}

export default App;
