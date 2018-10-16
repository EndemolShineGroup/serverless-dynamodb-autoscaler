import { AutoScalingPlans, Fn } from 'cloudform';

import { CapacityConfig } from './types/plugin';

const getScalingInstruction = (config: CapacityConfig, isRead: boolean) => {
  const { table, index } = config;

  const resource = ['table/', { Ref: table }];

  let type = 'table';

  if (index) {
    type = index as string;
    resource.push('/index/', index as string);
  }

  const target = isRead ? config.read! : config.write!;

  return new AutoScalingPlans.ScalingPlan.ScalingInstruction({
    ServiceNamespace: 'dynamodb',
    ResourceId: Fn.Join('', resource),
    MinCapacity: target.minimum ? target.minimum : 5,
    MaxCapacity: target.maximum ? target.maximum : 200,
    ScalableDimension: `dynamodb:${type}:${
      isRead ? 'Read' : 'Write'
    }CapacityUnits`,
    TargetTrackingConfigurations: [
      new AutoScalingPlans.ScalingPlan.TargetTrackingConfiguration({
        TargetValue: target.usage ? target.usage * 100 : 75,
        ScaleInCooldown: target.scaleIn ? target.scaleIn : 60,
        ScaleOutCooldown: target.scaleOut ? target.scaleOut : 60,
        PredefinedScalingMetricSpecification: new AutoScalingPlans.ScalingPlan.PredefinedScalingMetricSpecification(
          {
            PredefinedScalingMetricType: isRead
              ? 'DynamoDBReadCapacityUtilization'
              : 'DynamoDBWriteCapacityUtilization',
          },
        ),
      }),
    ],
  });
};

export default getScalingInstruction;
