import util from 'util';

import { AutoScalingPlans, Refs } from 'cloudform';
import { isArray, merge } from 'lodash';

import getScalingInstruction from './getScalingInstruction';
import { CapacityConfig } from './types/plugin';
import * as OutputMessages from './utils/output-messages';
import validateInput from './utils/validation';

export default class DynamoDBAutoscaling {
  public hooks: {
    [key: string]: () => Promise<any>;
  };

  private serverless: any;

  constructor(serverless: any) {
    this.serverless = serverless;

    this.hooks = {
      'package:compileEvents': this.execute,
    };
  }

  private execute = (): Promise<any> => {
    return Promise.resolve()
      .then(() => {
        return validateInput(this.serverless);
      })
      .then(() => {
        return this.serverless.cli.log(util.format(OutputMessages.CLI_START));
      })
      .then(this.process)
      .then(() => {
        return this.serverless.cli.log(util.format(OutputMessages.CLI_DONE));
      })
      .catch((err: Error) => {
        this.serverless.cli.log(
          util.format(OutputMessages.CLI_SKIP, err.message),
        );
        throw new Error('aws-dynamodb-autoscaling failed with exit code 1');
      });
  };

  private process = () => {
    let scalingInstructions: any[] = [];
    const DependsOn: string[] = [];

    this.serverless.service.custom.capacities.map((config: CapacityConfig) => {
      if (config.index) {
        config.index = isArray(config.index) ? config.index : [config.index];
      }

      scalingInstructions = [
        ...scalingInstructions,
        ...this.getScalingInstructions(config),
      ];

      DependsOn.push(config.table);
    });

    const AutoScalingPlan = new AutoScalingPlans.ScalingPlan({
      ApplicationSource: new AutoScalingPlans.ScalingPlan.ApplicationSource({
        CloudFormationStackARN: Refs.StackId,
      }),
      ScalingInstructions: scalingInstructions,
    });

    AutoScalingPlan.DependsOn = DependsOn;

    merge(
      this.serverless.service.provider.compiledCloudFormationTemplate.Resources,
      { AutoScalingPlan },
    );
  };

  private getScalingInstructions = (config: CapacityConfig) => {
    let scalingInstructions: any[] = [];

    if (config.index) {
      // Create scaling instruction for each index
      (config.index as string[]).forEach((i: string) => {
        scalingInstructions = [
          ...scalingInstructions,
          ...this.generateInstructions(config),
        ];
      });

      if (config.indexOnly) {
        return scalingInstructions;
      }
    }

    // Create scaling instruction for the table
    scalingInstructions = [
      ...scalingInstructions,
      ...this.generateInstructions({
        table: config.table,
        write: config.write,
        read: config.read,
      }),
    ];

    return scalingInstructions;
  };

  private generateInstructions = (config: CapacityConfig) => {
    const scalingInstructions: any[] = [];

    this.serverless.cli.log(
      util.format(
        OutputMessages.CLI_RESOURCE,
        config.table,
        config.index ? '/index/' + config.index : '',
      ),
    );

    // Only add Auto Scaling for read capacity if configuration set is available
    if (!!config.read) {
      scalingInstructions.push(getScalingInstruction(config, true));
    }

    // Only add Auto Scaling for write capacity if configuration set is available
    if (!!config.write) {
      scalingInstructions.push(getScalingInstruction(config, false));
    }

    return scalingInstructions;
  };
}
