import uuidv4 from 'uuid/v4';

class PerformanceTestFibonacciHelper {
    processingCallback(inputs, outputs, state) {
        let fibonacci = (num) => {
            var a = 1, b = 0, temp;

            while (num >= 0) {
                temp = a;
                a = a + b;
                b = temp;
                num--;
            }

            return b;
        }
        let result = fibonacci(inputs.fibonacciLength);

        if (result === inputs.correctValue) {
            outputs.finishedProcessingID = inputs.myID;
        }
    }

    static createInteractionSpecs() {
        return {
            id: uuidv4(),
            name: 'test-fibonacci-interaction',
            inputFormats: [{
                internalName: 'myID',
                messageFormat: 'string'
            },
            {
                internalName: 'fibonacciLength',
                messageFormat: 'double'
            },
            {
                internalName: 'correctValue',
                messageFormat: 'double'
            }],
            output_formats: [{
                internalName: 'finishedProcessingID',
                messageFormat: 'string'
            }],
            processingCallback: this.processingCallback.toString()
        }
    }
}

export default PerformanceTestFibonacciHelper;