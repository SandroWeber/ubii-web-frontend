import uuidv4 from 'uuid/v4';

class PerformanceTestFibonacciHelper {
  static SEQENCE_LENGTH_INPUT_SUFFIX = 'fibonacciInput';
  static PROCESSED_OUTPUT_SUFFIX = 'fibonacciResult';
  static processingCallback(inputs, outputs) {
    let fibonacci = num => {
      var a = 1,
        b = 0,
        temp;

      while (num >= 0) {
        temp = a;
        a = a + b;
        b = temp;
        num--;
      }

      return b;
    };
    let result = fibonacci(inputs.fibonacciInput);

    outputs.fibonacciResult = result;
  }

  static createInteractionSpecs(number) {
    return {
      id: uuidv4(),
      name: 'test-fibonacci-interaction-' + number,
      inputFormats: [
        {
          internalName:
            PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX,
          messageFormat: 'double'
        }
      ],
      outputFormats: [
        {
          internalName: PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX,
          messageFormat: 'double'
        }
      ],
      processingCallback: PerformanceTestFibonacciHelper.processingCallback.toString()
    };
  }

  static createSessionSpecs(number) {
    return {
      id: uuidv4(),
      name: 'test-fibonacci-session-' + number,
      interactions: [],
      ioMappings: []
    };
  }

  static addInteractionToSession(sessionSpecs, interactionSpecs) {
    sessionSpecs.interactions.push(interactionSpecs);

    let topicPrefix = '/' + interactionSpecs.id + '/';
    let ioMappings = {
      interactionId: interactionSpecs.id,
      inputMappings: [],
      outputMappings: []
    };
    interactionSpecs.inputFormats.forEach(element => {
      ioMappings.inputMappings.push({
        name: element.internalName,
        topicSource: topicPrefix + element.internalName
      });
    });
    interactionSpecs.outputFormats.forEach(element => {
      ioMappings.outputMappings.push({
        name: element.internalName,
        topicDestination: topicPrefix + element.internalName
      });
    });
    sessionSpecs.ioMappings.push(ioMappings);
  }

  static createTestSpecs(sessionCount, interactionCountPerSession) {
    let allSessionSpecs = [];

    for (let s = 0; s < sessionCount; s++) {
      let sessionSpecs = this.createSessionSpecs(s);

      for (let i = 0; i < interactionCountPerSession; i++) {
        let interactionSpecs = this.createInteractionSpecs(i);
        this.addInteractionToSession(sessionSpecs, interactionSpecs);
      }

      allSessionSpecs.push(sessionSpecs);
    }

    return allSessionSpecs;
  }
}

export default PerformanceTestFibonacciHelper;
