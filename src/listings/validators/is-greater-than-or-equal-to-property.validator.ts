import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isGreaterThanOrEqualToProperty', async: false })
export class IsGreaterThanOrEqualToPropertyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, validationArguments: ValidationArguments): boolean {
    const [relatedPropertyName] = validationArguments.constraints as string[];
    const relatedValue = (
      validationArguments.object as Record<string, unknown>
    )[relatedPropertyName];

    if (
      value === undefined ||
      value === null ||
      relatedValue === undefined ||
      relatedValue === null
    ) {
      return true;
    }

    if (
      typeof value !== 'number' ||
      typeof relatedValue !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isFinite(relatedValue)
    ) {
      return true;
    }

    return value >= relatedValue;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    const [relatedPropertyName] = validationArguments.constraints as string[];

    return `${validationArguments.property} must be greater than or equal to ${relatedPropertyName}`;
  }
}
