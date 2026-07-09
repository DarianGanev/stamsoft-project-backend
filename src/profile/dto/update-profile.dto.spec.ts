import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateProfileDto } from './update-profile.dto';

const validateProfile = (input: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateProfileDto, input);

  return {
    dto,
    errors: validateSync(dto),
  };
};

describe('UpdateProfileDto', () => {
  it('trims profile fields before validation', () => {
    const { dto, errors } = validateProfile({
      name: ' Driver ',
      phone: ' +359888123456 ',
    });

    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject({
      name: 'Driver',
      phone: '+359888123456',
    });
  });

  it('rejects whitespace-only names', () => {
    const { errors } = validateProfile({ name: '   ' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      isNotEmpty: 'name should not be empty',
    });
  });
});
