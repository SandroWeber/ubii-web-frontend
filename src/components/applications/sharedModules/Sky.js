import * as THREE from 'three';

export default class Sky extends THREE.Mesh {

  constructor() {
    super(new THREE.SphereBufferGeometry(75, 16, 8), _MATERIAL);

    this.name = "Sky";
  }

}

const _SHADER = {
  uniforms: {
    "skyExp": {
      value: 0.9
    },
    "azimuthExp": {
      value: 0.005
    },
    "skyColor": {
      value: new THREE.Vector3(0.37, 0.52, 0.73)
    },
    "groundColor": {
      value: new THREE.Vector3(0.71, 0.71, 0.71)
    },
    "azimuth": {
      value: new THREE.Vector3(0.89, 0.96, 1)
    },
    "skyIntensity": {
      value: 1.0
    },
  },

  vertexShader: `
	varying vec2 vUv;

	void main()	{
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
		vUv = uv;
	}
	`,

  fragmentShader: `
	varying vec2 vUv;

	uniform float skyExp;
	uniform float azimuthExp;
	uniform vec3 skyColor;
	uniform vec3 groundColor;
	uniform vec3 azimuth;
	uniform float skyIntensity;

	void mainImage(out vec4 fragColor, in vec2 fragCoord) {

		float skyFac = 1.0 - pow(abs(min(1.0, 1.0 - vUv.y)), skyExp);
		float azimuthFac = 1.0 - pow(abs(min(1.0, 1.0 + vUv.y)), azimuthExp);
		float groundFac = 1.0 - skyFac - azimuthFac;

		vec3 sky = skyColor * skyFac + groundColor * groundFac + azimuth * azimuthFac;
		fragColor =  vec4(sky * skyIntensity, 1.0);
	}

	void main() {
		mainImage(gl_FragColor, gl_FragCoord.xy);
	}
	`

};

const _MATERIAL = new THREE.ShaderMaterial({
  vertexShader: _SHADER.vertexShader,
  fragmentShader: _SHADER.fragmentShader,
  uniforms: _SHADER.uniforms,
  side: THREE.BackSide,
  depthWrite: false
});