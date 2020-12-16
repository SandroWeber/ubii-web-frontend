import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default class UbiiSessionCocoSSD {
  constructor(
    topicImageInput,
    topicPredictionsOutput,
    predictionsOverlayElement
  ) {
    this.topicImageInput = topicImageInput;
    this.topicPredictionsOutput = topicPredictionsOutput;
    this.predictionsOverlayElement = predictionsOverlayElement;

    this.sessionRunning = false;

    // ubii specifications
    this.name = 'Session-CoCo-SSD-Object-Detection';
    this.tags = ['coco-ssd', 'object-detection'];
    this.processingModules = [{ name: 'coco-ssd-object-detection' }];
    this.ioMappings = [
      {
        processingModuleName: 'coco-ssd-object-detection',
        inputMappings: [{ inputName: 'image', topicSource: topicImageInput }],
        outputMappings: [
          {
            outputName: 'predictions',
            topicDestination: topicPredictionsOutput
          }
        ]
      }
    ];
  }

  startSession() {
    UbiiClientService.waitForConnection().then(() => {
      this.cocoSSDLabels = [];

      UbiiClientService.subscribeTopic(
        this.topicPredictionsOutput,
        this.handleObjectPredictions.bind(this)
      );

      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
        session: this
      }).then(response => {
        if (response.error) {
          // eslint-disable-next-line no-console
          console.warn(response.error);
        } else if (response.session) {
          Object.assign(this, response.session);
          this.sessionRunning = true;
        }
      });
    });
  }

  stopSession() {
    this.sessionRunning = false;

    UbiiClientService.waitForConnection().then(() => {
      UbiiClientService.unsubscribeTopic(
        this.topicPredictionsOutput,
        this.handleObjectPredictions
      ).then(() => {
        while (this.predictionsOverlayElement.hasChildNodes()) {
          this.predictionsOverlayElement.removeChild(
            this.predictionsOverlayElement.childNodes[0]
          );
        }
        this.cocoSSDLabels = [];
      });

      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this
      }).then(response => {
        if (response.error) {
          // eslint-disable-next-line no-console
          console.warn(response.error);
        }
      });
    });
  }

  handleObjectPredictions(predictedObjectsList) {
    if (!this.sessionRunning) {
      return;
    }

    let predictionsList = predictedObjectsList.elements;

    while (this.cocoSSDLabels.length < predictionsList.length) {
      let divElement = document.createElement('div');
      divElement.style.color = 'black';
      divElement.style.border = '5px solid rgba(255, 255, 0, 0.4)';
      divElement.style.position = 'relative';
      divElement.style.textAlign = 'left';
      divElement.style.fontWeight = 'bold';
      this.predictionsOverlayElement.appendChild(divElement);
      this.cocoSSDLabels.push(divElement);
    }

    let overlayBoundings = this.predictionsOverlayElement.getBoundingClientRect();
    this.cocoSSDLabels.forEach((div, index) => {
      if (index < predictionsList.length) {
        div.innerHTML = predictionsList[index].id;
        // set position
        div.style.left =
          Math.floor(
            predictionsList[index].pose.position.x * overlayBoundings.width
          ) + 'px';
        div.style.top =
          Math.floor(
            predictionsList[index].pose.position.y * overlayBoundings.height
          ) + 'px';
        // set size
        div.style.width =
          Math.floor(predictionsList[index].size.x * overlayBoundings.width) +
          'px';
        div.style.height =
          Math.floor(predictionsList[index].size.y * overlayBoundings.height) +
          'px';
        div.style.textShadow = '0px 0px 10px yellow';

        div.style.visibility = 'visible';
      } else {
        div.style.visibility = 'hidden';
      }
    });
  }
}
