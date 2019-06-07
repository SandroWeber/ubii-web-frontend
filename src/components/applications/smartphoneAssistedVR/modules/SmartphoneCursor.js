import * as THREE from "three";

export default class SmartphoneCursor extends THREE.Object3D {

  constructor(areaSize = new THREE.Vector2(1, 1)) {
    // parent
    super();
    this.name = "Smartphone Cursor";

    // consts
    this.SELECT_TIME = 1.5; // in seconds
    this.MAX_VELOCITY = 0.00001;

    // public members
    this.areaSize = areaSize;

    // private members
    this._normalizedPosition = new THREE.Vector2(0, 0);
    this._cursorPosition = new THREE.Vector3(0, 0, 0);
    this._isTouching = false;
    this._isSelecting = false;
    this._selectProgress = 0;
    this._cursorVelocity = new THREE.Vector2(0, 0);

    this._init();
  }


  // private methods
  _init() {
    this._cursor = new THREE.Mesh(new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("images/circle.png"),
      transparent: true,
    }));
    this._cursor.visible = false;
    this.add(this._cursor);

    this._selector = new THREE.Mesh(new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("images/circle_filled.png"),
      transparent: true,
    }));
    this._selector.visible = false;
    this._selector.position.set(0, 0, 0.01);
    this._cursor.add(this._selector);

    //this._cursor.add(new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshBasicMaterial())); // debug cube
  }

  _onSelect() {
    // eslint-disable-next-line no-console
    console.info("SELECTED: " + this._cursorPosition.x + " " + this._cursorPosition.y)
  }

  _smartphoneToLocalPosition(pos2d) {
    const pos3d = new THREE.Vector3(pos2d.x * this.areaSize.x, -pos2d.y * this.areaSize.y, 0);

    return pos3d;
  }


  // public methods
  /* eslint-disable-next-line no-unused-vars */
  render(delta) {
    const isNotMoving = this._cursorVelocity.lengthSq() < this.MAX_VELOCITY;

    const percentage = (this._selectProgress / this.SELECT_TIME) + 0.0001; // size should never be 0
    this._selector.scale.set(percentage, percentage, percentage);

    // detect selecting state
    if (!this._isSelecting && isNotMoving && this._isTouching) {
      this._selectProgress = 0;
      this._cursorVelocity = new THREE.Vector3(0, 0, 0);
      this._isSelecting = true;
    } else if (this._isSelecting && (!isNotMoving || !this._isTouching)) {
      this._isSelecting = false;
    }

    // select animation
    if (this._isSelecting) {
      this._selectProgress += delta;

      if (this._selectProgress >= this.SELECT_TIME) {
        this._selectProgress = 0;
        this._onSelect();
      }
    }
  }


  // getters & setters
  set cursorPosition(pos2d) {
    if (!this._isTouching) {
      return;
    }

    this._cursorVelocity = pos2d.clone().sub(this._normalizedPosition);
    this._normalizedPosition = pos2d;

    const pos3d = this._smartphoneToLocalPosition(pos2d);
    this._cursor.position = pos3d;
    this._cursorPosition = pos3d;
  }

  get cursorPosition() {
    return this._cursorPosition;
  }

  set touched(value) {
    this._isTouching = value;
    this._cursor.visible = value;
    this._selector.visible = value;

    if (!value) {
      this._isSelecting = false;
    }
  }

  get touched() {
    return this._isTouching;
  }

}