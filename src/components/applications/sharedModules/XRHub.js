import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class XRHub {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.createGroundPlane();

        this.webContentScene = new THREE.Scene();
        this.webContentrenderer = new CSS3DRenderer();
        this.webContentrenderer.setSize(
            container.clientWidth,
            container.clientHeight
        );
    }

    createGroundPlane() {
        var geometry = new THREE.PlaneBufferGeometry(20, 20);
        geometry.rotateX(THREE.Math.degToRad(90));
        var material = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        var plane = new THREE.Mesh(geometry, material);
        this.scene.add(plane);
    }

    static createWebCanvas(url, x, y, z, ry) {
        var div = document.createElement('div');
        div.style.width = '480px';
        div.style.height = '360px';
        div.style.backgroundColor = '#000';

        var iframe = document.createElement('iframe');
        iframe.style.width = '480px';
        iframe.style.height = '360px';
        iframe.style.border = '0px';
        iframe.src = url;
        div.appendChild(iframe);

        var object = new CSS3DObject(div);
        object.position.set(x, y, z);
        object.rotation.y = ry;

        return object;
    }
}

export default XRHub;