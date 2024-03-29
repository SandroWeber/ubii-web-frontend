class PerformanceTestFibonacciHelper {
  static SEQENCE_LENGTH_INPUT_SUFFIX = 'fibonacciInput';
  static PROCESSED_OUTPUT_SUFFIX = 'fibonacciResult';

  static processingCallback(deltaTime, inputs) {
    let outputs = {};

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

    if (inputs.fibonacciInput && inputs.fibonacciInput.int32) {
      result = fibonacci(inputs.fibonacciInput.int32);
      result = result === Infinity ? Number.MAX_SAFE_INTEGER : result;
      outputs.fibonacciResult = {
        int32: result
      }
    }

    return { outputs };
  }

  static createProcessingModuleSpecs(index, nodeId) {
    return {
      name: 'test-fibonacci-pm-' + index,
      processingMode: {
        frequency: {
          hertz: 1000000 // basically go as fast as you can
        }
      },
      inputs: [
        {
          internalName:
            PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX,
          messageFormat: 'int32'
        }
      ],
      outputs: [
        {
          internalName: PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX,
          messageFormat: 'int32'
        }
      ],
      onProcessingStringified: PerformanceTestFibonacciHelper.processingCallback.toString(),
      nodeId: nodeId
    };
  }

  static createSessionSpecs(number) {
    return {
      name: 'test-fibonacci-session-' + number,
      processingModules: [],
      ioMappings: []
    };
  }

  static addProcessingModuleToSession(sessionSpecs, pmSpecs, nodeId) {
    sessionSpecs.processingModules.push(pmSpecs);

    let topicPrefix = PerformanceTestFibonacciHelper.getTopicPrefix(nodeId, sessionSpecs.name, pmSpecs.name);
    let ioMapping = {
      processingModuleName: pmSpecs.name,
      inputMappings: [],
      outputMappings: []
    };
    pmSpecs.inputs.forEach(element => {
      ioMapping.inputMappings.push({
        inputName: element.internalName,
        topicSource: 'topic',
        topic: topicPrefix + '/' + element.internalName
      });
    });
    pmSpecs.outputs.forEach(element => {
      ioMapping.outputMappings.push({
        outputName: element.internalName,
        topicDestination: 'topic',
        topic: topicPrefix + '/' + element.internalName
      });
    });
    sessionSpecs.ioMappings.push(ioMapping);
  }

  static createTestSpecs(sessionCount, pmCountPerSession, nodeId) {
    let allSessionSpecs = [];

    for (let s = 0; s < sessionCount; s++) {
      let sessionSpecs = this.createSessionSpecs(s);

      for (let i = 0; i < pmCountPerSession; i++) {
        let pmSpecs = this.createProcessingModuleSpecs(i, nodeId);
        this.addProcessingModuleToSession(sessionSpecs, pmSpecs, nodeId);
      }

      allSessionSpecs.push(sessionSpecs);
    }

    return allSessionSpecs;
  }

  static getTopicPrefix(nodeId, sessionName, pmName) {
    return '/' + nodeId + '/' + sessionName + '/' + pmName;
  }
}

export default PerformanceTestFibonacciHelper;
