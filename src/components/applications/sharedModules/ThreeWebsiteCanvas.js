import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
export class ThreeWebsiteCanvas extends ThreeWebContentCanvas{
  constructor(resolutionWidth, resolutionHeight, name, url) {
    super(resolutionWidth, resolutionHeight, name);
    this.updateUrl(url);

    this.webGLCanvas.userData.updateUrl = this.updateUrl.bind(this);
  }

  createCSS3DCanvas() {
    const div = document.createElement('div');
    div.style.width = this.resolution[0] + 'px';
    div.style.height = this.resolution[1] + 'px';
    div.style.backgroundColor = '#000';

    const iframe = document.createElement('iframe');
    iframe.style.width = this.resolution[0] + 'px';
    iframe.style.height = this.resolution[1] + 'px';
    iframe.style.border = '0px';
    iframe.src = this.url;
    div.appendChild(iframe);

    const object = new CSS3DObject(div);
    object.name = this.name;
    object.userData = {website: iframe};

    return object;
  }

  updateUrl(url){
    this.url = url;
    this.css3DCanvas.userData.website.src = url;
  }
}