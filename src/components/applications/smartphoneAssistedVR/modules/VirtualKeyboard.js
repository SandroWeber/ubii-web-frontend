import * as THREE from "three";

export default class VirtualKeyboard extends THREE.Object3D {

  constructor(areaSize = new THREE.Vector2(1, 1)) {
    // parent
    super();
    this.name = "Smartphone Cursor";

    // public members
    this.areaSize = areaSize;
  }

  // public methods
  /* eslint-disable-next-line no-unused-vars */
  onPress(worldPos) {

  }

}