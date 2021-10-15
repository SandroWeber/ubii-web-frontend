const pe = {

    exampleSession: {
        "id": "1",
        "name": "web-mouse-example-session",
        "processingModules": [
            {
                "onProcessingStringified": "function processingCallback(deltaTime, inputs\n      /*state*/\n      ) {\n        if (!inputs.clientPointer) {\n          return {};\n        }\n\n        var outputs = {};\n\n        if (inputs.mirrorPointer === true) {\n          outputs.serverPointer = {\n            x: 1 - inputs.clientPointer.x,\n            y: 1 - inputs.clientPointer.y\n          };\n        } else {\n          outputs.serverPointer = {\n            x: inputs.clientPointer.x,\n            y: inputs.clientPointer.y\n          };\n        }\n\n        return {\n          outputs: outputs\n        };\n      }",
                "name": "mirror-mouse-pointer",
                "processingMode": {
                    "frequency": {
                        "hertz": 60
                    }
                },
                "inputs": [
                    {
                        "internalName": "clientPointer",
                        "messageFormat": "ubii.dataStructure.Vector2"
                    },
                    {
                        "internalName": "mirrorPointer",
                        "messageFormat": "bool"
                    }
                ],
                "outputs": [
                    {
                        "internalName": "serverPointer",
                        "messageFormat": "ubii.dataStructure.Vector2"
                    }
                ],
                "sessionId": "1",
                "nodeId": "22222",
                "id": "10"
            }
        ],
        "ioMappings": [
            {
                "processingModuleName": "mirror-mouse-pointer",
                "inputMappings": [
                    {
                        "inputName": "clientPointer",
                        "topicSource": "topic",
                        "topic": "/10000/web-example-mouse-pointer/mouse_client_position"
                    },
                    {
                        "inputName": "mirrorPointer",
                        "topicSource": "topic",
                        "topic": "/10000/web-example-mouse-pointer/mirror_mouse"
                    }
                ],
                "outputMappings": [
                    {
                        "outputName": "serverPointer",
                        "topicDestination": "topic",
                        "topic": "/10000/web-example-mouse-pointer/mouse_server_position"
                    }
                ],
                "processingModuleId": "10"
            }
        ],
        "status": 1
    },
    procList: [
        {
            "id": "10",
            "name": "mirror-mouse-pointer",
            "nodeId": "22222",
            "sessionId": "1",
            "status": 2,
            "processingMode": {
                "frequency": {
                    "hertz": 60
                },
                "mode": "frequency"
            },
            "inputs": [
                {
                    "internalName": "clientPointer",
                    "messageFormat": "ubii.dataStructure.Vector2"
                },
                {
                    "internalName": "mirrorPointer",
                    "messageFormat": "bool"
                }
            ],
            "outputs": [
                {
                    "internalName": "serverPointer",
                    "messageFormat": "ubii.dataStructure.Vector2"
                }
            ],
            "language": 2,
            "onProcessingStringified": "function processingCallback(deltaTime, inputs\n      /*state*/\n      ) {\n        if (!inputs.clientPointer) {\n          return {};\n        }\n\n        var outputs = {};\n\n        if (inputs.mirrorPointer === true) {\n          outputs.serverPointer = {\n            x: 1 - inputs.clientPointer.x,\n            y: 1 - inputs.clientPointer.y\n          };\n        } else {\n          outputs.serverPointer = {\n            x: inputs.clientPointer.x,\n            y: inputs.clientPointer.y\n          };\n        }\n\n        return {\n          outputs: outputs\n        };\n      }",
            "ids": [
                "New",
                "{\"Proc ID\":\"e9a93686-ea52-4bc8-8813-a17a124c84dd\",\"Status\":2}"
            ]
        }
    ],
    exampleClients: [
        {
            "id": "10000",
            "name": "Ubi-Interact Web Frontend",
            "devices": [
                {
                    "id": "0adf1de1-a079-434c-a73a-694a5462bc44",
                    "name": "web-example-mouse-pointer",
                    "deviceType": 0,
                    "components": [
                        {
                            "topic": "/10000/web-example-mouse-pointer/mouse_client_position",
                            "messageFormat": "ubii.dataStructure.Vector2",
                            "ioType": 0,
                            "id": "69d6123a-edf4-401b-8ebe-0e27753456be",
                            "name": "2D pointer original"
                        },
                        {
                            "topic": "/10000/web-example-mouse-pointer/mirror_mouse",
                            "messageFormat": "bool",
                            "ioType": 0,
                            "id": "48432d4b-3721-4b5d-97af-496088828198",
                            "name": "2D pointer mirroring around center"
                        },
                        {
                            "topic": "/10000/web-example-mouse-pointer/mouse_server_position",
                            "messageFormat": "ubii.dataStructure.Vector2",
                            "ioType": 1,
                            "id": "aaf879bd-0066-450c-826c-5bf48575d8f6",
                            "name": "2D pointer processed"
                        }
                    ],
                    "clientId": "10000"
                }
            ],
            "state": 0,
            "latency": 1
        }
    ],
    exampleDev: {
        "id": "e3539fd9-b992-487f-b916-6e9e5ce2c127",
        "name": "Ubi-Interact Web Frontend",
        "devices": [
            {
                "id": "8bf768bc-4ba5-4879-9cb3-3fd6f3bfa03d",
                "name": "web-example-mouse-pointer",
                "deviceType": 0,
                "components": [
                    {
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mouse_client_position",
                        "messageFormat": "ubii.dataStructure.Vector2",
                        "ioType": 0,
                        "id": "51ff7f3f-7c9d-4443-88d0-26514127c8ff",
                        "name": "2D pointer original"
                    },
                    {
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mirror_mouse",
                        "messageFormat": "bool",
                        "ioType": 0,
                        "id": "61806824-e34d-4d3d-95d9-9cfffd88f395",
                        "name": "2D pointer mirroring around center"
                    },
                    {
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mouse_server_position",
                        "messageFormat": "ubii.dataStructure.Vector2",
                        "ioType": 1,
                        "id": "ad460658-bb06-484b-9f75-ce7e52cb6c8d",
                        "name": "2D pointer processed"
                    }
                ],
                "clientId": "e3539fd9-b992-487f-b916-6e9e5ce2c127",
                "position": [
                    0,
                    0
                ]
            }
        ],
        "state": 0
    },
    async returnProcs () {
        return this.procList
    }
    
} 

export default { ...pe }