import * as THREE from "three";

export default class VirtualKeyboard extends THREE.Object3D {

  constructor(area, callback) {
    // parent
    super();
    this.name = "Smartphone Cursor";

    // public members
    this.area = area;
    this.callback = callback;

    this._build();
  }

  // private methods
  _build() {
    const keyMap = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      [" ", "a", "s", "d", "f", "g", "h", "j", "k", "l"],
      [" ", " ", "z", "x", "c", "v", "b", "n", "m"]
    ];

    const resolution = 64;
    const keyCount = {
      x: keyMap[0].length,
      y: keyMap.length
    }
    const padding = 2;

    const canvasWidth = this.area.width;
    const canvasHeight = this.area.height;

    const keyWidth = canvasWidth / keyCount.x;
    const keyHeight = canvasHeight / keyCount.y;


    const keyWidthPixel = keyWidth * resolution;
    const keyHeightPixel = keyHeight * resolution;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth * resolution + padding;
    canvas.height = canvasHeight * resolution + padding;
    const context = canvas.getContext("2d");

    for (var i = 0; i < keyMap.length; i++) {
      const keys = keyMap[i];
      for (var c = 0; c < keys.length; c++) {
        const key = keys[c];
        const x = keyWidthPixel * c;
        const y = keyHeightPixel * i;

        context.strokeStyle = "#333333";
        context.fillStyle = "#666666";
        context.beginPath();
        context.rect(x, y, keyWidthPixel, keyHeightPixel);
        //context.fill();
        context.stroke();
        context.textAlign = "center";
        context.font = "Normal 40px Arial";
        context.fillStyle = "#99FF33";
        context.fillText(key, x + keyWidthPixel / 2, y + keyHeightPixel / 2 + 4);
      }
    }

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture
    });
    material.transparent = true;
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight),
      material
    );

    this.add(mesh);
  }

  // public methods
  /* eslint-disable-next-line no-unused-vars */
  onPress(event) {
    const localPos = event.localPos;

    const keyMap = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      [" ", "a", "s", "d", "f", "g", "h", "j", "k", "l"],
      [" ", " ", "z", "x", "c", "v", "b", "n", "m"]
    ];

    const resolution = 32;
    const keySizeHeightToWidthRatio = 1.2;
    const keyCount = {
      x: keyMap[0].length,
      y: keyMap.length
    }
    const padding = 2;

    const canvasWidth = this.width;

    const keyWidth = canvasWidth / keyCount.x;
    const keyHeight = keyWidth * keySizeHeightToWidthRatio;
    const canvasHeight = keyHeight * keyCount.y;

    let x = Math.floor(localPos.x * keyCount.x);
    let y = Math.floor(localPos.y * keyCount.y);

    if (y >= 0 && y < keyMap.length && x >= 0 && x < keyMap[y].length) {
      //console.log(localPos.x + " " + canvasWidth + " " + +keyCount.x + " " + this.width)
      console.log(keyMap[y][x])
      this.callback(keyMap[y][x])
    }

  }
}