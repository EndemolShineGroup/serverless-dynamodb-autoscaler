export const expectedTemplate: string = `{
  "cli": {},
  "service": {
    "provider": {
      "name": "aws",
      "compiledCloudFormationTemplate": {
        "Resources": {
          "AutoScalingPlan": {
            "Type": "AWS::AutoScalingPlans::ScalingPlan",
            "Properties": {
              "ApplicationSource": {
                "CloudFormationStackARN": {
                  "Ref": "AWS::StackId"
                }
              },
              "ScalingInstructions": [
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table1"
                        },
                        "/index/",
                        [
                          "table1-index"
                        ]
                      ]
                    ]
                  },
                  "MinCapacity": 1,
                  "MaxCapacity": 5,
                  "ScalableDimension": "dynamodb:table1-index:ReadCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 20,
                      "ScaleInCooldown": 60,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBReadCapacityUtilization"
                      }
                    }
                  ]
                },
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table1"
                        },
                        "/index/",
                        [
                          "table1-index"
                        ]
                      ]
                    ]
                  },
                  "MinCapacity": 1,
                  "MaxCapacity": 5,
                  "ScalableDimension": "dynamodb:table1-index:WriteCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 20,
                      "ScaleInCooldown": 60,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBWriteCapacityUtilization"
                      }
                    }
                  ]
                },
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table1"
                        }
                      ]
                    ]
                  },
                  "MinCapacity": 1,
                  "MaxCapacity": 5,
                  "ScalableDimension": "dynamodb:table:ReadCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 20,
                      "ScaleInCooldown": 60,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBReadCapacityUtilization"
                      }
                    }
                  ]
                },
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table1"
                        }
                      ]
                    ]
                  },
                  "MinCapacity": 1,
                  "MaxCapacity": 5,
                  "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 20,
                      "ScaleInCooldown": 60,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBWriteCapacityUtilization"
                      }
                    }
                  ]
                },
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table2"
                        }
                      ]
                    ]
                  },
                  "MinCapacity": 2,
                  "MaxCapacity": 10,
                  "ScalableDimension": "dynamodb:table:ReadCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 80,
                      "ScaleInCooldown": 90,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBReadCapacityUtilization"
                      }
                    }
                  ]
                },
                {
                  "ServiceNamespace": "dynamodb",
                  "ResourceId": {
                    "Fn::Join": [
                      "",
                      [
                        "table/",
                        {
                          "Ref": "Table2"
                        }
                      ]
                    ]
                  },
                  "MinCapacity": 4,
                  "MaxCapacity": 20,
                  "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
                  "TargetTrackingConfigurations": [
                    {
                      "TargetValue": 40,
                      "ScaleInCooldown": 60,
                      "ScaleOutCooldown": 60,
                      "PredefinedScalingMetricSpecification": {
                        "PredefinedScalingMetricType": "DynamoDBWriteCapacityUtilization"
                      }
                    }
                  ]
                }
              ]
            },
            "DependsOn": [
              "Table1",
              "Table2"
            ]
          }
        }
      }
    },
    "custom": {
      "capacities": [
        {
          "table": "Table1",
          "index": [
            "table1-index"
          ],
          "read": {
            "minimum": 1,
            "maximum": 5,
            "usage": 0.2
          },
          "write": {
            "minimum": 1,
            "maximum": 5,
            "usage": 0.2
          }
        },
        {
          "table": "Table2",
          "read": {
            "minimum": 2,
            "maximum": 10,
            "usage": 0.8,
            "scaleIn": 90
          },
          "write": {
            "minimum": 4,
            "maximum": 20,
            "usage": 0.4
          }
        }
      ]
    }
  }
}`;
