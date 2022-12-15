import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { MSG_TYPES } from '@tum-far/ubii-msg-formats';
const UbiiImage2D = ProtobufLibrary.ubii.dataStructure.Image2D;
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiComponent from './ubii-component-base';

const TOPIC_SUFFIX = 'camera_image';

const UBII_SPECS = {
  name: 'web-component-camera',
  messageFormat: MSG_TYPES.DATASTRUCTURE_IMAGE,
  ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['camera', 'image', '2D'],
  description: 'web interface - camera componenent'
};

export default class UbiiComponentCamera extends UbiiComponent {
  constructor(publishFrequencyMS, ubiiImageFormat, videoPlaybackElement) {
    super(TOPIC_SUFFIX, UBII_SPECS);

    this.publishFrequencyMS = publishFrequencyMS;
    this.ubiiImageFormat = ubiiImageFormat;
    this.videoPlaybackElement = videoPlaybackElement;
  }

  async onStart() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.videoPlaybackElement) {
        this.videoPlaybackElement.srcObject = this.mediaStream;
      }

      const track = this.mediaStream.getVideoTracks()[0];
      this.imageCapture = new ImageCapture(track);

      await UbiiClientService.instance.waitForConnection();
      this.continuousPublishing();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

  onStop() {}

  async continuousPublishing() {
    let imageBitmap = await this.grabFrame();
    this.publishFrame(imageBitmap);

    if (this.running) {
      setTimeout(() => {
        this.continuousPublishing();
      }, this.publishFrequencyMS);
    }
  }

  /* under firefox, ImageCapture API seems to be buggy */
  async grabFrame() {
    console.info('grabFrame');
    let imageBitmap = await this.imageCapture.grabFrame().catch(error => console.error(error));
    console.info(imageBitmap);
    /*let blob = await this.imageCapture.takePhoto().catch(error => console.error(error));
    console.info(blob);*/
    return imageBitmap;
  }

  /* unfortunately necessary to double memory, wait for bitmaprenderer API to finalize and be bug-free */
  getFrameBuffer(imageBitmap) {
    var canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    let ctx = null; //canvas.getContext('bitmaprenderer');
    if (ctx) {
      ctx.transferFromImageBitmap(imageBitmap);
    } else {
      // in case someone supports createImageBitmap only
      // twice in memory...
      ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  publishFrame(imageBitmap) {
    let imageBuffer = this.getFrameBuffer(imageBitmap);
    let data = imageBuffer.data;
    if (this.ubiiImageFormat === UbiiImage2D.DataFormat.RGB8) {
      // reduce from RGBA8 to RGB8, fitting tensorflow model
      data = data.filter((element, index) => {
        return (index + 1) % 4 !== 0;
      });
    }

    UbiiClientService.instance.publishRecord({
      topic: this.ubiiSpecs.topic,
      timestamp: UbiiClientService.instance.generateTimestamp(),
      image2D: {
        width: imageBuffer.width,
        height: imageBuffer.height,
        data: data,
        dataFormat: this.ubiiImageFormat
      }
    });
  }
}
