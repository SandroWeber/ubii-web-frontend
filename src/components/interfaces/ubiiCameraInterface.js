import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { MSG_TYPES } from '@tum-far/ubii-msg-formats';
const UbiiImage2D = ProtobufLibrary.ubii.dataStructure.Image2D;
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

const TOPIC_SUFFIX = '/camera_image';

export default class UbiiCameraInterface {
  constructor(
    ubiiImageFormat,
    topicPrefix,
    publishFrequencyMS,
    videoPlaybackElement
  ) {
    this.ubiiImageFormat = ubiiImageFormat;
    this.topicPrefix = topicPrefix;
    this.topic = this.topicPrefix + TOPIC_SUFFIX;
    this.publishFrequencyMS = publishFrequencyMS;
    this.videoPlaybackElement = videoPlaybackElement;
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(mediaStream => {
        this.mediaStream = mediaStream;
        if (this.videoPlaybackElement) {
          this.videoPlaybackElement.srcObject = this.mediaStream;
        }

        const track = mediaStream.getVideoTracks()[0];
        this.imageCapture = new ImageCapture(track);

        UbiiClientService.waitForConnection().then(() => {
          let continuousPublishing = async () => {
            let imageBitmap = await this.grabFrame();
            this.publishFrame(imageBitmap);

            if (this.running) {
              setTimeout(continuousPublishing, this.publishFrequencyMS);
            }
          };
          continuousPublishing();
        });
      })
      // eslint-disable-next-line no-console
      .catch(error => console.log(error));
  }

  stop() {
    this.running = false;
  }

  /* under firefox, ImageCapture API seems to be buggy */
  async grabFrame() {
    let imageBitmap = await this.imageCapture
      .grabFrame()
      // eslint-disable-next-line no-console
      .catch(error => console.log(error));
    return imageBitmap;
  }

  /* unfortunately necessary to double memory, wait for bitmaprenderer API to finalize and be bug-free */
  getFrameBuffer(image) {
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    let ctx = null; //canvas.getContext('bitmaprenderer');
    if (ctx) {
      // transfer the ImageBitmap to it
      ctx.transferFromImageBitmap(image);
    } else {
      // in case someone supports createImageBitmap only
      // twice in memory...
      ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
    }
    return canvas
      .getContext('2d')
      .getImageData(0, 0, canvas.width, canvas.height);
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

    UbiiClientService.publishRecord({
      topic: this.topic,
      timestamp: UbiiClientService.generateTimestamp(),
      image2D: {
        width: imageBuffer.width,
        height: imageBuffer.height,
        data: data,
        dataFormat: this.ubiiImageFormat
      }
    });
  }

  getUbiiComponent() {
    return {
      topic: this.topic,
      messageFormat: MSG_TYPES.DATASTRUCTURE_IMAGE,
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
      tags: ['camera', 'image', '2D'],
      description: 'web interface for device camera'
    };
  }
}
