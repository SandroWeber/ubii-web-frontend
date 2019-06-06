import * as THREE from "three";


export default class SmartphoneCursor extends THREE.Object3D {

  constructor() {
    super();

    this.name = "Smartphone Cursor";

    const geom = new THREE.PlaneBufferGeometry();
    //geom.scale.set(0.8, 0.8, 0.8)
    this.add(new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
      transparent: true,
      map: new THREE.TextureLoader().load("images/circle.png")
    })))


  }

}