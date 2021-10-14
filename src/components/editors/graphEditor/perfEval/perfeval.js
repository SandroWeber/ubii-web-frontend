const pe = {

    exampleSession: {
        "id": "398e4c59-98f3-42e5-815b-6d5675b339e4",
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
                "sessionId": "398e4c59-98f3-42e5-815b-6d5675b339e4",
                "nodeId": "528062aa-45b6-4016-bcb7-786cc1411861",
                "id": "7b59560d-11d4-4afe-95ca-296690911a1a"
            }
        ],
        "ioMappings": [
            {
                "processingModuleName": "mirror-mouse-pointer",
                "inputMappings": [
                    {
                        "inputName": "clientPointer",
                        "topicSource": "topic",
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mouse_client_position"
                    },
                    {
                        "inputName": "mirrorPointer",
                        "topicSource": "topic",
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mirror_mouse"
                    }
                ],
                "outputMappings": [
                    {
                        "outputName": "serverPointer",
                        "topicDestination": "topic",
                        "topic": "/e3539fd9-b992-487f-b916-6e9e5ce2c127/web-example-mouse-pointer/mouse_server_position"
                    }
                ],
                "processingModuleId": "7b59560d-11d4-4afe-95ca-296690911a1a"
            }
        ],
        "status": 1
    },
    exampleProc: {
        "id": "7b59560d-11d4-4afe-95ca-296690911a1a",
        "name": "mirror-mouse-pointer",
        "nodeId": "528062aa-45b6-4016-bcb7-786cc1411861",
        "sessionId": "398e4c59-98f3-42e5-815b-6d5675b339e4",
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
            "{\"Proc ID\":\"7b59560d-11d4-4afe-95ca-296690911a1a\",\"Status\":2}"
        ]
    },
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
    }

} 

export default { ...pe }