class ThreeWebContentCanvas {
  constructor(url, webglScene, css3DScene) {
    this.webglScene = webglScene;
    this.css3DScene = css3DScene;
  }

  createWebGLCanvas() {
    // create the plane mesh
    let material = new THREE.MeshBasicMaterial();
    material.color.set('black');
    material.opacity = 0;
    material.blending = THREE.NoBlending;

    let geometry = new THREE.PlaneGeometry();
    let webglPlaneMesh = new THREE.Mesh(geometry, material);

    return webglPlaneMesh;
  }

  createCSS3DCanvas(url, x, y, z, ry) {
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

export default ThreeWebContentCanvas;
