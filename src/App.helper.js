const SCALE = 10

let tempPoints = [];
let consideredPoints = {};

export const inputTypes = Object.freeze({ text: 'textInput', file: 'fileContent' });

export const fillText = (canvas, x, y, symbol) => {
  canvas.textCanvas[y][x] = symbol;
  canvas.getContext("2d").fillText(symbol, (x - 1) * SCALE, y * SCALE, SCALE);
};

export const fillPoint = (canvas, prevSymbol, fillableSymbol) => {
  for (; tempPoints.length > 0;) {
    const { x, y } = tempPoints.shift();

    if (y === 0) {
      continue;
    }

    fillText(canvas, x, y, fillableSymbol);

    if (x < 2 || y < 0) {
      continue;
    }

    const leftPos = { x: x - 1, y: y };
    const rightPos = { x: x + 1, y: y };

    const topPos = { x: x, y: y - 1 };
    const bottomPos = { x: x, y: y + 1 };

    const directions = [leftPos, rightPos, topPos, bottomPos];
    directions.forEach(direction => {
      if (
        canvas.textCanvas[direction.y] &&
        canvas.textCanvas[direction.y][direction.x] === prevSymbol &&
        canvas.originalWidth >= direction.x &&
        canvas.originalHeight >= direction.y &&
        !consideredPoints[`(${direction.x};${direction.y})`]
        // !tempPoints.find(p => p.x === direction.x && p.y === direction.y)
      ) {
          tempPoints.push({ x: direction.x, y: direction.y });
          consideredPoints[`(${direction.x};${direction.y})`] = true;
      }
    });
  }

  consideredPoints = {};
};

export const commandsMapper = {
  C: {
    type: 'element',
    func: args => {
      // Scale just for better appearance
      const [width, height] = args;
      const canvas = document.createElement('canvas');

      canvas.width = width * SCALE;
      canvas.height = (height + 1) * SCALE;

      Object.defineProperty(canvas, 'originalWidth', { value: 0, writable: true });
      Object.defineProperty(canvas, 'originalHeight', { value: 0, writable: true });
      Object.defineProperty(canvas, 'textCanvas', { value: [], writable: false });

      canvas.originalWidth = width;
      canvas.originalHeight = height;

      // Extra array for top and bottom borders
      for (let i = 0; i <= height + 1; i++) {
        canvas.textCanvas[i] = [];
      }

      // information about drew objects
      // deprecated in my-app v0.9.0
      Object.defineProperty(canvas, 'metaObject', { value: [], writable: false });

      return canvas;
    }
  },
  L: {
    type: 'shape',
    func: (canvas, args) => {
      const [x, y, x1, y1] = args;
      canvas.metaObject.push({ type: 'L', coordinates: args });

      if (x === x1) {
        const [yFrom, yTo] = y1 > y ? [y, y1] : [y1, y];
        for (let i = yFrom; i <= yTo; i++) {
          fillText(canvas, x, i, 'x');
        }
      } else if (y === y1) {
        const [xFrom, xTo] = x1 > x ? [x, x1] : [x1, x];
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
      const [x, y, x1, y1] = args;

      const [xFrom, xTo] = x1 > x ? [x, x1] : [x1, x];
      const [yFrom, yTo] = y1 > y ? [y, y1] : [y1, y];

      canvas.metaObject.push({ type: 'R', coordinates: args, height: yTo - yFrom, width: xTo - xFrom });

      for (const x of [xFrom, xTo]) {
        for (let i = yFrom + 1; i < yTo; i++) {
          fillText(canvas, x, i, 'x');
        }
      }

      for (const y of [yFrom, yTo]) {
        for (let i = xFrom; i <= xTo; i++) {
          fillText(canvas, i, y, 'x');
        }
      }
    }
  },
  B: {
    type: 'fill',
    func: (canvas, args) => {
      const [xB, yB, c] = args;
      tempPoints.push({ x: xB, y: yB });
      consideredPoints[`(${xB};${yB})`] = true;
      fillPoint(canvas, canvas.textCanvas[yB][xB], c);
    }
  }
}
