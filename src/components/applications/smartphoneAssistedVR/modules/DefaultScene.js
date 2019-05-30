import * as THREE from "three";
import Sky from "../../sharedModules/Sky";

function addCamera(scene, aspectRatio) {
    let camera = new THREE.PerspectiveCamera(
        70,
        aspectRatio,
        0.01,
        100
    );
    camera.position.z = 1;

    scene.add(camera);
    return camera;
}

function addLight(scene) {
    let group = new THREE.Group();
    group.name = "Lights";

    let ambient = new THREE.AmbientLight(0x444444);
    group.add(ambient);

    let directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();
    group.add(directionalLight);

    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 500, 0);
    group.add(hemiLight);

    scene.add(group);
    return group;
}

function addSky(scene) {
    let sky = new Sky();

    scene.fog = new THREE.Fog(0x23272a, 0.5, 1700, 4000);

    scene.add(sky);
    return sky;
}

function addBase(scene) {
    let group = new THREE.Group();
    group.name = "Base";

    let radius = 0.75;
    let geometry = new THREE.CylinderGeometry(radius, radius, 0.05, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0x808080
    });
    group.add(new THREE.Mesh(geometry, material));

    group.add(
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0.06, 0),
            0.3,
            0x4262f4
        )
    );
    group.add(
        new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0.06, 0),
            0.3,
            0xdb3e00
        )
    );

    group.add(new THREE.GridHelper(10, 10, 0xf7f7f7, 0xc4c4c4));

    scene.add(group);
    return group;
}

let DefaultScene = function (scene, aspectRatio, camera = true, light = true, sky = true, base = true) {

    let group = new THREE.Group();
    group.name = "Default Scene";

    if (camera)
        this.camera = addCamera(scene, aspectRatio);
    if (light)
        this.light = addLight(scene);
    if (sky)
        this.sky = addSky(scene);
    if (base)
        this.base = addBase(scene);


    scene.add(group);
}

export default DefaultScene;