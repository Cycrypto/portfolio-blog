import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('accepts an empty email so the admin can clear the field', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      email: '',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('');
  });

  it('trims and accepts a valid email address', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      email: '  admin@example.com  ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('admin@example.com');
  });

  it('rejects an invalid non-empty email address', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      email: 'not-an-email',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });
});
