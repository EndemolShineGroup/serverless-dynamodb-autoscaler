import util from 'util';

import { cloneDeep } from 'lodash';

import Plugin from './DynamoDBAutoscaling';
import * as OutputMessages from './utils/output-messages';

import { expectedTemplate } from './__fixtures__/expectedCloudformationTemplate';

const serverless: any = {
  cli: {
    log: console.log,
  },
  service: {
    provider: {
      name: 'aws',
      compiledCloudFormationTemplate: {
        Resources: {},
      },
    },
    custom: {
      capacities: [
        {
          table: 'Table1',
          index: ['table1-index'],
          read: {
            minimum: 1,
            maximum: 5,
            usage: 0.2,
          },
          write: {
            minimum: 1,
            maximum: 5,
            usage: 0.2,
          },
        },
        {
          table: 'Table2',
          read: {
            minimum: 2,
            maximum: 10,
            usage: 0.8,
            scaleIn: 90,
          },
          write: {
            minimum: 4,
            maximum: 20,
            usage: 0.4,
          },
        },
      ],
    },
  },
};

const getPlugingPromise = (config: any): Promise<any> => {
  return new Plugin({
    cli: {
      log: console.log,
    },
    ...config,
  }).hooks['package:compileEvents']();
};

describe('DynamoDBAutoscaling Plugin', () => {
  it('Table2 write should have default values set', () => {
    const data = cloneDeep(serverless);
    data.service.custom.capacities[1].write = {};
    return getPlugingPromise(data).then(() => {
      let targetObject: any = null;

      data.service.provider.compiledCloudFormationTemplate.Resources.AutoScalingPlan.Properties.ScalingInstructions.forEach(
        (instruction: any) => {
          if (
            instruction.ResourceId.payload[1][1]['Ref'] === 'Table2' &&
            instruction.ScalableDimension ===
              'dynamodb:table:WriteCapacityUnits'
          ) {
            targetObject = instruction;
          }
        },
      );

      expect(targetObject.MinCapacity).toEqual(5);
      expect(targetObject.MaxCapacity).toEqual(200);
      const tracking: any = targetObject.TargetTrackingConfigurations[0];
      expect(tracking.TargetValue).toEqual(75);
      expect(tracking.ScaleInCooldown).toEqual(60);
      expect(tracking.ScaleOutCooldown).toEqual(60);
    });
  });

  it('generate a valid template', () => {
    return getPlugingPromise(serverless).then(() => {
      expect(JSON.stringify(serverless, null, 2)).toEqual(expectedTemplate);
    });
  });
}); // End describe

describe('DynamoDBAutoscaling Plugin Errors', () => {
  let spy: any;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log');
  });

  /*
    TODO?: Jest does not seem to like testing the promises the way I want (return expect(promise).rejects.toThrow());
    Therefore I'm using the hacky solution you will encounter in the tests below. We are testing for errors, so if the promise
    falls into `then` we have to fail the test. Any other tests you want to do (check error message and such) can be done inside
    `catch`. Any improvements to this is very welcome!
  */

  it('Empty configuration (Bad config)', () => {
    return getPlugingPromise({})
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalledWith(
          util.format(
            OutputMessages.CLI_SKIP,
            OutputMessages.INVALID_CONFIGURATION,
          ),
        );
      });
  });

  it('Partial configuration 1 (Bad config)', () => {
    return getPlugingPromise({
      service: {},
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalledWith(
          util.format(
            OutputMessages.CLI_SKIP,
            OutputMessages.INVALID_CONFIGURATION,
          ),
        );
      });
  });

  it('Wrong provider "azure" (Bad config)', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'azure',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalledWith(
          util.format(OutputMessages.CLI_SKIP, OutputMessages.ONLY_AWS_SUPPORT),
        );
      });
  });

  it('Missing pluging config (Bad config)', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {},
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalledWith(
          util.format(
            OutputMessages.CLI_SKIP,
            OutputMessages.NO_AUTOSCALING_CONFIG,
          ),
        );
      });
  });

  it('pluging config is empty (Bad capacities config)', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: {},
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalledWith(
          util.format(
            OutputMessages.CLI_SKIP,
            OutputMessages.NO_AUTOSCALING_CONFIG,
          ),
        );
      });
  });

  it('capacities config has only table', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.MUST_DEFINE_READ_OR_WRITE),
        );
      });
  });

  it('capacities target minimum too low', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
              write: {
                minimum: 0,
              },
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.CAPACITY_OUT_OF_BOUNDS),
        );
      });
  });

  it('capacities target minimum too high', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
              write: {
                minimum: 1,
                maximum: 41000,
              },
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.CAPACITY_OUT_OF_BOUNDS),
        );
      });
  });

  it('capacities target usage out of bounds', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
              write: {
                minimum: 1,
                maximum: 5,
                usage: 10,
              },
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.USAGE_OUT_OF_BOUNDS),
        );
      });
  });

  it('capacities target scaleIn not Int', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
              write: {
                minimum: 1,
                maximum: 5,
                usage: 0.5,
                scaleIn: 0.1,
              },
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.SCALE_MUST_BE_INTEGER),
        );
      });
  });

  it('capacities target scaleIn not Int', () => {
    return getPlugingPromise({
      service: {
        provider: {
          name: 'aws',
          compiledCloudFormationTemplate: {
            Resources: {},
          },
        },
        custom: {
          capacities: [
            {
              table: 'Table1',
              write: {
                minimum: 1,
                maximum: 5,
                usage: 0.5,
                scaleIn: 1,
                scaleOut: 0.1,
              },
            },
          ],
        },
      },
    })
      .then(() => {
        //Force fail the test
        expect(true).toBeFalsy();
      })
      .catch(() => {
        expect(spy).toHaveBeenCalled();
        const latestLog = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.INVALID_TARGET_CONFIG),
        );
        expect(latestLog).toMatch(
          new RegExp(OutputMessages.SCALE_MUST_BE_INTEGER),
        );
      });
  });
}); // End describe
