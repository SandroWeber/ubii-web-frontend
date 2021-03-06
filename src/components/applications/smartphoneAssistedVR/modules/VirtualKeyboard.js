import * as THREE from 'three';

const _RESOLUTION = 64;

export default class VirtualKeyboard extends THREE.Object3D {
  constructor(area, fontSize = 35, callback) {
    // parent
    super();
    this.name = 'Smartphone Cursor';

    // public members
    this.area = area;
    this.fontSize = fontSize;
    this.callback = callback;
    this.shift = false;
    this.capsLock = false;

    // private members
    this._actionMap = [];
    this._canvas = undefined;
    this._mesh = undefined;
    this._material = undefined;
    this._texture = undefined;

    this._draw(true);
  }

  // private methods
  _draw(actionMap = false) {
    // constants
    const padding = 2;

    const canvasWidth = this.area.width;
    const canvasHeight = this.area.height;

    // calculate single key dimensions
    let longestRow = 0;
    let longestColumn = VirtualKeyboard.KEY_MAP.length;

    for (let y = 0; y < VirtualKeyboard.KEY_MAP.length; y++) {
      const row = VirtualKeyboard.KEY_MAP[y];
      let currWidth = 0;
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
    if (!this._context) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * _RESOLUTION + padding;
      canvas.height = canvasHeight * _RESOLUTION + padding;
      this._canvas = canvas;
    }
    const context = this._canvas.getContext('2d');
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // ensemble keyboard
    for (let y = 0; y < VirtualKeyboard.KEY_MAP.length; y++) {
      const row = VirtualKeyboard.KEY_MAP[y];

      const actions = [];
      const currentY = y * keyHeightPixel;
      let currentX = 0;

      for (let x = 0; x < row.length; x++) {
        const key = VirtualKeyboard.KEY_MAP[y][x];
        const width = key.width ? key.width : 1;
        const pixelWidth = width * keyWidthPixel;

        // write action map
        if (actionMap) {
          actions.push({
            width: currentX,
            key: key
          });
        }

        // draw the key
        context.strokeStyle = '#333333';
        context.beginPath();
        context.rect(currentX, currentY, pixelWidth, keyHeightPixel);
        if (key.key || key.label) {
          if (
            this.capsLock &&
            key.action == VirtualKeyboard.KEY_ACTIONS.CAPS_LOCK
          ) {
            context.fillStyle = '#42b3f4';
          } else if (
            this.shift &&
            key.action == VirtualKeyboard.KEY_ACTIONS.SHIFT
          ) {
            context.fillStyle = '#42b3f4';
          } else {
            context.fillStyle = '#666666';
          }
          context.fill();
        }
        context.stroke();
        context.textAlign = 'center';
        context.font = 'Normal ' + this.fontSize + 'px Arial';
        context.fillStyle = '#99FF33';

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

          const label = key.label
            ? key.label
            : (this.capsLock || this.shift) && key.keyCaps
            ? key.keyCaps
            : key.key;
          context.fillText(
            label,
            currentX + keyWidthPixel / 2 + offset,
            currentY + keyHeightPixel / 2 + 5
          );
        }

        currentX += pixelWidth;
      }

      if (actionMap) {
        this._actionMap.push(actions);
      }
    }

    if (!this._mesh) {
      this._texture = new THREE.Texture(this._canvas);
      this._texture.minFilter = THREE.LinearFilter;
      this._texture.needsUpdate = true;

      this._material = new THREE.MeshBasicMaterial({
        map: this._texture,
        opacity: 1,
        transparent: true
      });
      this._mesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight),
        this._material
      );

      this.add(this._mesh);
    } else if (this._texture && this._material) {
      this._texture = new THREE.Texture(this._canvas);
      this._texture.minFilter = THREE.LinearFilter;
      this._texture.needsUpdate = true;
      this._material.map = this._texture;
      this._material.needsUpdate = true;
    }
  }

  // public methods
  // eslint-disable-next-line no-unused-vars
  onPress(event) {
    const localPos = event.localPos;
    const pixelPosX = localPos.x * this.area.width * _RESOLUTION;
    const keyRow = Math.floor(localPos.y * this._actionMap.length);
    if (
      keyRow >= 0 &&
      keyRow < this._actionMap.length &&
      pixelPosX >= 0 &&
      pixelPosX < this.area.width * _RESOLUTION
    ) {
      // eslint-disable-next-line for-direction
      for (let x = this._actionMap[keyRow].length - 1; x >= 0; x--) {
        const action = this._actionMap[keyRow][x];

        if (action.width <= pixelPosX) {
          switch (action.key.action) {
            case VirtualKeyboard.KEY_ACTIONS.SHIFT:
              this.shift = !this.shift;
              this._draw();
              break;
            case VirtualKeyboard.KEY_ACTIONS.CAPS_LOCK:
              this.shift = false;
              this.capsLock = !this.capsLock;
              this._draw();
              break;
            case VirtualKeyboard.KEY_ACTIONS.NONE:
            case undefined:
            default:
              this.callback({
                action: action.key.action,
                key:
                  (this.capsLock || this.shift) && action.key.keyCaps
                    ? action.key.keyCaps
                    : action.key.key
              });
              if (this.shift) {
                this.shift = false;
                this._draw();
              }
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
};

VirtualKeyboard.KEY_ALIGNMENT = {
  LEFT: 0,
  RIGHT: 1,
  CENTER: 2
};

VirtualKeyboard.KEY_MAP = [
  [
    {
      key: '`',
      keyCaps: '~'
    },
    {
      key: '1',
      keyCaps: '!'
    },
    {
      key: '2',
      keyCaps: '@'
    },
    {
      key: '3',
      keyCaps: '#'
    },
    {
      key: '4',
      keyCaps: '$'
    },
    {
      key: '5',
      keyCaps: '%'
    },
    {
      key: '6',
      keyCaps: '^'
    },
    {
      key: '7',
      keyCaps: '&'
    },
    {
      key: '8',
      keyCaps: '*'
    },
    {
      key: '9',
      keyCaps: '('
    },
    {
      key: '0',
      keyCaps: ')'
    },
    {
      key: '-',
      keyCaps: '_'
    },
    {
      key: '=',
      keyCaps: '+'
    },
    {
      key: '←',
      action: VirtualKeyboard.KEY_ACTIONS.DELETE_ONE,
      width: 2,
      align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
    }
  ],
  [
    {
      width: 1.5
    },
    {
      key: 'q',
      keyCaps: 'Q'
    },
    {
      key: 'w',
      keyCaps: 'W'
    },
    {
      key: 'e',
      keyCaps: 'E'
    },
    {
      key: 'r',
      keyCaps: 'R'
    },
    {
      key: 't',
      keyCaps: 'T'
    },
    {
      key: 'y',
      keyCaps: 'Y'
    },
    {
      key: 'u',
      keyCaps: 'U'
    },
    {
      key: 'i',
      keyCaps: 'I'
    },
    {
      key: 'o',
      keyCaps: 'O'
    },
    {
      key: 'p',
      keyCaps: 'P'
    },
    {
      key: '[',
      keyCaps: '{'
    },
    {
      key: ']',
      keyCaps: '}'
    },
    {
      key: '\\',
      keyCaps: '|',
      width: 1.5
    }
  ],
  [
    {
      key: '↓',
      action: VirtualKeyboard.KEY_ACTIONS.CAPS_LOCK,
      width: 2
    },
    {
      key: 'a',
      keyCaps: 'A'
    },
    {
      key: 's',
      keyCaps: 'S'
    },
    {
      key: 'd',
      keyCaps: 'D'
    },
    {
      key: 'f',
      keyCaps: 'F'
    },
    {
      key: 'g',
      keyCaps: 'G'
    },
    {
      key: 'h',
      keyCaps: 'H'
    },
    {
      key: 'j',
      keyCaps: 'J'
    },
    {
      key: 'k',
      keyCaps: 'K'
    },
    {
      key: 'l',
      keyCaps: 'L'
    },
    {
      key: ';',
      keyCaps: ':'
    },
    {
      key: "'",
      keyCaps: '"'
    },
    {
      key: ' ◄┘',
      action: VirtualKeyboard.KEY_ACTIONS.RETURN,
      width: 2,
      align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
    }
  ],
  [
    {
      key: '↑',
      action: VirtualKeyboard.KEY_ACTIONS.SHIFT,
      width: 2.5
    },
    {
      key: 'z',
      keyCaps: 'Z'
    },
    {
      key: 'x',
      keyCaps: 'X'
    },
    {
      key: 'c',
      keyCaps: 'C'
    },
    {
      key: 'v',
      keyCaps: 'V'
    },
    {
      key: 'b',
      keyCaps: 'B'
    },
    {
      key: 'n',
      keyCaps: 'N'
    },
    {
      key: 'm',
      keyCaps: 'M'
    },
    {
      key: ',',
      keyCaps: '<'
    },
    {
      key: '.',
      keyCaps: '>'
    },
    {
      key: '/',
      keyCaps: '?'
    },
    {
      key: '↑',
      action: VirtualKeyboard.KEY_ACTIONS.SHIFT,
      width: 2.5,
      align: VirtualKeyboard.KEY_ALIGNMENT.RIGHT
    }
  ],
  [
    {
      width: 3.5
    },
    {
      key: ' ',
      label: '_',
      width: 8,
      align: VirtualKeyboard.KEY_ALIGNMENT.CENTER
    },
    {
      width: 3.5
    }
  ]
];
