import * as THREE from "three";

const _RESOLUTION = 64;

export default class VirtualKeyboard extends THREE.Object3D {

  constructor(area, callback) {
    // parent
    super();
    this.name = "Smartphone Cursor";

    // public members
    this.area = area;
    this.callback = callback;
    this.shift = false;
    this.capsLock = false;

    // private members
    this.actionMap = [];

    this._build();
  }

  // private methods
  _build() {

    // constants
    const padding = 2;

    const canvasWidth = this.area.width;
    const canvasHeight = this.area.height;

    // calculate single key dimensions
    let longestRow = 0;
    let longestColumn = VirtualKeyboard.KEY_MAP.length;

    for (let y = 0; y < VirtualKeyboard.KEY_MAP.length; y++) {
      const row = VirtualKeyboard.KEY_MAP[y];
      let currWidth = 0
      for (let x = 0; x < row.length; x++) {
        const key = VirtualKeyboard.KEY_MAP[y][x];
        currWidth += key.width ? key.width : 1;
      }
      if (currWidth > longestRow) {
        longestRow = currWidth;
      }
    }
    // calculate key sizes
    const keyWidth = canvasWidth / longestRow;
    const keyHeight = canvasHeight / longestColumn;

    const keyWidthPixel = keyWidth * _RESOLUTION;
    const keyHeightPixel = keyHeight * _RESOLUTION;

    // create canvas
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth * _RESOLUTION + padding;
    canvas.height = canvasHeight * _RESOLUTION + padding;
    const context = canvas.getContext("2d");

    // ensemble keyboard
    for (let y = 0; y < VirtualKeyboard.KEY_MAP.length; y++) {
      const row = VirtualKeyboard.KEY_MAP[y];

      const actions = []
      const currentY = y * keyHeightPixel;
      let currentX = 0;

      for (let x = 0; x < row.length; x++) {
        const key = VirtualKeyboard.KEY_MAP[y][x];
        const width = key.width ? key.width : 1;
        const pixelWidth = width * keyWidthPixel

        // write action map
        actions.push({
          width: currentX,
          key: key
        })

        // draw the key
        context.strokeStyle = "#333333";
        context.fillStyle = "#666666";
        context.beginPath();
        context.rect(currentX, currentY, pixelWidth, keyHeightPixel);
        if (key.key || key.label) {
          context.fill();
        }
        context.stroke();
        context.textAlign = "center";
        context.font = "Normal 40px Arial";
        context.fillStyle = "#99FF33";

        if (key.key || key.label) {
          let offset = 0;

          switch (key.align) {
            case VirtualKeyboard.KEY_ALIGNMENT.CENTER:
              offset = pixelWidth / 2 - keyWidthPixel / 2;
              break;
            case VirtualKeyboard.KEY_ALIGNMENT.RIGHT:
              offset = pixelWidth - keyWidthPixel;
              break;
            case VirtualKeyboard.KEY_ALIGNMENT.LEFT:
            case undefined:
            default:
              break;
          }

          const label = key.label ? key.label : ((this.capsLock || this.shift) && key.keyCaps ? key.keyCaps : key.key)
          context.fillText(label, currentX + keyWidthPixel / 2 + offset, currentY + keyHeightPixel / 2 + 10);
        }

        currentX += pixelWidth;
      }

      this.actionMap.push(actions);
    }

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      opacity: 1,
      transparent: true
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight),
      material
    );

    this.add(mesh);
  }

  // public methods
  // eslint-disable-next-line no-unused-vars
  onPress(event) {

    const localPos = event.localPos;
    const pixelPosX = localPos.x * this.area.width * _RESOLUTION;
    const keyRow = Math.floor(localPos.y * this.actionMap.length);
    if (keyRow >= 0 && keyRow < this.actionMap.length && pixelPosX >= 0 && pixelPosX < this.area.width * _RESOLUTION) {

      // eslint-disable-next-line for-direction
      for (let x = this.actionMap[keyRow].length - 1; x >= 0; x--) {
        const action = this.actionMap[keyRow][x];

        if (action.width <= pixelPosX) {

          switch (action.key.action) {
            case VirtualKeyboard.KEY_ACTIONS.SHIFT:
              this.shift = !this.shift;
              break;
            case VirtualKeyboard.KEY_ACTIONS.CAPS_LOCK:
              this.shift = false;
              this.capsLock = !this.capsLock;
              break;
            case VirtualKeyboard.KEY_ACTIONS.NONE:
            case undefined:
            default:
              this.callback({
                action: action.key.action,
                key: (this.capsLock || this.shift) && action.key.keyCaps ? action.key.keyCaps : action.key.key
              });
              this.shift = false;
              break;
          }
          return;

        }
      }

    }

  }
}

VirtualKeyboard.KEY_ACTIONS = {
  NONE: 0,
  DELETE_ONE: 1,
  CLEAR: 2,
  RETURN: 3,
  SHIFT: 4,
  CAPS_LOCK: 5
}

VirtualKeyboard.KEY_ALIGNMENT = {
  LEFT: 0,
  RIGHT: 1,
  CENTER: 2
}

VirtualKeyboard.KEY_MAP = [
  [{
    key: "`",
    keyCaps: "~"
  }, {
    key: "1",
    keyCaps: "!"
  }, {
    key: "2",
    keyCaps: "@"
  }, {
    key: "3",
    keyCaps: "#"
  }, {
    key: "4",
    keyCaps: "$"
  }, {
    key: "5",
    keyCaps: "%"
  }, {
    key: "6",
    keyCaps: "^"
  }, {
    key: "7",
    keyCaps: "&"
  }, {
    key: "8",
    keyCaps: "*"
  }, {
    key: "9",
    keyCaps: "("
  }, {
    key: "10",
    keyCaps: ")"
  }, {
    key: "-",
    keyCaps: "_"
  }, {
    key: "=",
    keyCaps: "+"
  }, {
    key: "←",
    action: VirtualKeyboard.KEY_ACTIONS.DELETE_ONE,
    width: 2,
    align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
  }],
  [{
    width: 1.5
  }, {
    key: "q",
    keyCaps: "Q",
  }, {
    key: "w",
    keyCaps: "W"
  }, {
    key: "e",
    keyCaps: "E"
  }, {
    key: "r",
    keyCaps: "R"
  }, {
    key: "t",
    keyCaps: "T"
  }, {
    key: "y",
    keyCaps: "Y"
  }, {
    key: "u",
    keyCaps: "U"
  }, {
    key: "i",
    keyCaps: "I"
  }, {
    key: "o",
    keyCaps: "O"
  }, {
    key: "p",
    keyCaps: "P"
  }, {
    key: "[",
    keyCaps: "{"
  }, {
    key: "]",
    keyCaps: "}"
  }, {
    key: "\\",
    keyCaps: "|",
    width: 1.5
  }],
  [{
    key: "↓",
    action: VirtualKeyboard.KEY_ACTIONS.CAPS_LOCK,
    width: 2
  }, {
    key: "a",
    keyCaps: "A"
  }, {
    key: "s",
    keyCaps: "S"
  }, {
    key: "d",
    keyCaps: "D"
  }, {
    key: "f",
    keyCaps: "F"
  }, {
    key: "g",
    keyCaps: "G"
  }, {
    key: "h",
    keyCaps: "H"
  }, {
    key: "j",
    keyCaps: "J"
  }, {
    key: "k",
    keyCaps: "K"
  }, {
    key: "l",
    keyCaps: "L"
  }, {
    key: ";",
    keyCaps: ":"
  }, {
    key: "'",
    keyCaps: "\""
  }, {
    key: " ◄┘",
    action: VirtualKeyboard.KEY_ACTIONS.RETURN,
    width: 2,
    align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
  }],
  [{
    key: "↑",
    action: VirtualKeyboard.KEY_ACTIONS.SHIFT,
    width: 2.5
  }, {
    key: "z",
    keyCaps: "Z"
  }, {
    key: "x",
    keyCaps: "X"
  }, {
    key: "c",
    keyCaps: "C"
  }, {
    key: "v",
    keyCaps: "V"
  }, {
    key: "b",
    keyCaps: "B"
  }, {
    key: "n",
    keyCaps: "n"
  }, {
    key: "m",
    keyCaps: "M"
  }, {
    key: ",",
    keyCaps: "<"
  }, {
    key: ".",
    keyCaps: ">"
  }, {
    key: "/",
    keyCaps: "?"
  }, {
    key: "↑",
    action: VirtualKeyboard.KEY_ACTIONS.SHIFT,
    width: 2.5,
    align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
  }],
  [{
    width: 3.5
  }, {
    key: " ",
    label: "_",
    width: 8,
    align: VirtualKeyboard.KEY_ALIGNMENT.CENTER
  }, {
    width: 3.5
  }]
];