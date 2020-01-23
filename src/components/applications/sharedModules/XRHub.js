import * as THREE from 'three';

class XRHub {
    constructor() {
        this.scene = new THREE.Scene();
        this.createGroundPlane();
    }

    createGroundPlane() {
        var geometry = new THREE.PlaneBufferGeometry(20, 20);
        geometry.rotateX(THREE.Math.degToRad(90));
        var material = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        var plane = new THREE.Mesh(geometry, material);
        this.scene.add(plane);
    }
}

export default XRHub;