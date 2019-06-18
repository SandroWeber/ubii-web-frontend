import * as THREE from 'three';

const _RESOLUTION = 64;

export default class TextDisplay extends THREE.Object3D {
  constructor(area) {
    // parent
    super();
    this.name = 'Text Display';

    // public members
    this.area = area;

    // private members
    this._text = '';
    this._canvas = undefined;
    this._mesh = undefined;
    this._material = undefined;
    this._texture = undefined;

    this._draw();
  }

  // private methods
  _draw() {
    // constants
    const canvasWidth = this.area.width;
    const canvasHeight = this.area.height;
    const padding = 20;
    const lineheight = 40;
    const lines = this._text.split('\n');

    // create canvas
    if (!this._context) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * _RESOLUTION + padding;
      canvas.height = canvasHeight * _RESOLUTION + padding;
      this._canvas = canvas;
    }
    const context = this._canvas.getContext('2d');
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    context.textAlign = 'left';
    context.font = 'Normal 40px Arial';
    context.fillStyle = '#99FF33';

    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], padding, padding + (i + 1) * lineheight);
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

  set text(text) {
    this._text = text;
    this._draw();
  }

  get text() {
    return this._text;
  }
}
