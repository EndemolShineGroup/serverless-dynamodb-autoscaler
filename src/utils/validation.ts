import { isArray } from 'lodash';

import { CapacityConfig, CapacityTarget } from '../types/plugin';
import * as OutputMessages from './output-messages';

const AWS_PROVIDER = 'aws';

let configErrors: string[] = [];

const validateInput = (input: any): Promise<string> => {
  configErrors = [];

  return new Promise((resolve, reject) => {
    // Check basic serverless template input
    if (!input) {
      return reject(errorMessage(OutputMessages.INVALID_CONFIGURATION));
    } else if (!input.service) {
      return reject(errorMessage(OutputMessages.INVALID_CONFIGURATION));
    } else if (!input.service.provider) {
      return reject(errorMessage(OutputMessages.INVALID_CONFIGURATION));
    } else if (!input.service.provider.name) {
      return reject(errorMessage(OutputMessages.INVALID_CONFIGURATION));
    } else if (input.service.provider.name !== AWS_PROVIDER) {
      return reject(errorMessage(OutputMessages.ONLY_AWS_SUPPORT));
    } else if (!input.service.custom) {
      return reject(errorMessage(OutputMessages.NO_AUTOSCALING_CONFIG));
    } else if (!input.service.custom.capacities) {
      return reject(errorMessage(OutputMessages.NO_AUTOSCALING_CONFIG));
    } else if (
      (input.service.custom.capacities &&
        !isArray(input.service.custom.capacities)) ||
      input.service.custom.capacities.length <= 0
    ) {
      return reject(errorMessage(OutputMessages.NO_AUTOSCALING_CONFIG));
    }
    // Check pluging config input
    if (!validateCapacityConfigs(input)) {
      return reject(errorMessage(getBadConfigErrorMessage()));
    }

    return resolve('');
  });
};

const errorMessage = (message: string) => {
  return { message };
};

const validateCapacityConfigs = (input: any): boolean => {
  const capacities = input.service.custom.capacities;

  let isTableFirstError: boolean = true;

  const isError = (tableName: string, message: string) => {
    if (isTableFirstError) {
      configErrors.push(`Errors found in ${tableName}:`);
    }
    isTableFirstError = false;
    configErrors.push(`  - ${message}`);
  };

  capacities.map((config: CapacityConfig) => {
    const targets: CapacityTarget[] = [];

    isTableFirstError = true;

    if (config.write) {
      targets.push(config.write);
    }

    if (config.read) {
      targets.push(config.read);
    }

    if (targets.length === 0) {
      isError(config.table, OutputMessages.MUST_DEFINE_READ_OR_WRITE);
    }

    targets.forEach((target: CapacityTarget) => {
      if (target.scaleIn && !Number.isInteger(target.scaleIn)) {
        isError(config.table, OutputMessages.SCALE_MUST_BE_INTEGER);
      }
      if (target.scaleOut && !Number.isInteger(target.scaleOut)) {
        isError(config.table, OutputMessages.SCALE_MUST_BE_INTEGER);
      }
      if (target.usage < 0.2 || target.usage > 0.8) {
        isError(config.table, OutputMessages.USAGE_OUT_OF_BOUNDS);
      }
      if (target.minimum < 1 || target.maximum > 40000) {
        isError(config.table, OutputMessages.CAPACITY_OUT_OF_BOUNDS);
      }
    });
  });

  return configErrors.length === 0;
};

const getBadConfigErrorMessage = (): string => {
  let errorMessage = OutputMessages.INVALID_TARGET_CONFIG;

  configErrors.forEach((error: string) => {
    errorMessage += '\n';
    errorMessage += error;
  });

  return errorMessage;
};

export default validateInput;
