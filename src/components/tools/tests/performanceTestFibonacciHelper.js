class PerformanceTestFibonacciHelper {
  static SEQENCE_LENGTH_INPUT_SUFFIX = 'fibonacciInput';
  static PROCESSED_OUTPUT_SUFFIX = 'fibonacciResult';
  static processingCallback(deltaTime, inputs, outputs) {
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

    return outputs;
  }

  static createProcessingModuleSpecs(number) {
    return {
      name: 'test-fibonacci-pm-' + number,
      processingMode: {
        frequency: {
          hertz: 1000000 // basically go as fast as you can
        }
      },
      inputs: [
        {
          internalName:
            PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX,
          messageFormat: 'double'
        }
      ],
      outputs: [
        {
          internalName: PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX,
          messageFormat: 'double'
        }
      ],
      onProcessingStringified: PerformanceTestFibonacciHelper.processingCallback.toString()
    };
  }

  static createSessionSpecs(number) {
    return {
      name: 'test-fibonacci-session-' + number,
      processingModules: [],
      ioMappings: []
    };
  }

  static addProcessingModuleToSession(sessionSpecs, pmSpecs) {
    sessionSpecs.processingModules.push(pmSpecs);

    let topicPrefix = '/' + sessionSpecs.name + '/' + pmSpecs.name + '/';
    let ioMapping = {
      processingModuleName: pmSpecs.name,
      inputMappings: [],
      outputMappings: []
    };
    pmSpecs.inputs.forEach(element => {
      ioMapping.inputMappings.push({
        inputName: element.internalName,
        topicSource: topicPrefix + element.internalName
      });
    });
    pmSpecs.outputs.forEach(element => {
      ioMapping.outputMappings.push({
        outputName: element.internalName,
        topicDestination: topicPrefix + element.internalName
      });
    });
    sessionSpecs.ioMappings.push(ioMapping);
  }

  static createTestSpecs(sessionCount, pmCountPerSession) {
    let allSessionSpecs = [];

    for (let s = 0; s < sessionCount; s++) {
      let sessionSpecs = this.createSessionSpecs(s);

      for (let i = 0; i < pmCountPerSession; i++) {
        let pmSpecs = this.createProcessingModuleSpecs(i);
        this.addProcessingModuleToSession(sessionSpecs, pmSpecs);
      }

      allSessionSpecs.push(sessionSpecs);
    }

    return allSessionSpecs;
  }
}

export default PerformanceTestFibonacciHelper;
