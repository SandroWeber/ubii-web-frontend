import * as THREE from "three";
import Sky from "../../sharedModules/Sky";

export default class DefaultSetup extends THREE.Object3D {

  constructor(scene, aspectRatio, camera = true, light = true, sky = true, base = true) {

    super();

    this.name = "Default Setup";
    this.type = "Group";
    this.isGroup = true;

    if (camera)
      this.camera = this.addCamera(scene, aspectRatio);
    if (light)
      this.light = this.addLight();
    if (sky)
      this.sky = this.addSky(scene);
    if (base)
      this.base = this.addBase();

  }

  addCamera(scene, aspectRatio) {

    const fov = 70;
    const nearPlane = 0.01;
    const farPlane = 100;

    const camera = new THREE.PerspectiveCamera(
      fov,
      aspectRatio,
      nearPlane,
      farPlane
    );

    camera.position.z = 1;

    this.add(camera);
    return camera;
  }

  addLight() {
    const group = new THREE.Group();
    group.name = "Lights";

    const ambient = new THREE.AmbientLight(0x444444);
    group.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();
    group.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 500, 0);
    group.add(hemiLight);

    this.add(group);
    return group;
  }

  addSky(scene) {
    const sky = new Sky();

    scene.fog = new THREE.Fog(0x23272a, 0.5, 1700, 4000);

    this.add(sky);
    return sky;
  }

  addBase() {
    const group = new THREE.Group();
    group.name = "Base";

    const radius = 0.75;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.05, 32);
    const material = new THREE.MeshBasicMaterial({
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

    this.add(group);
    return group;
  }

}