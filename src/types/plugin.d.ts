export interface CapacityConfig {
  table: string;
  index?: string | string[];
  indexOnly?: boolean;
  write?: CapacityTarget;
  read?: CapacityTarget;
}

export interface CapacityTarget {
  maximum: number;
  minimum: number;
  usage: number;
  scaleIn?: number;
  scaleOut?: number;
}

export interface Options {
  index: string;
  region: string;
  service: string;
  stage: string;
  table: string;
}

/**
 * Merged with empty default Serverless.Service.Custom declaration
 */
// declare namespace Serverless {
//   namespace Service {
//     interface Custom {
//       capacities: CapacityConfig[]
//     }
//   }
// }
