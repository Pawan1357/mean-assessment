import { PropertySeedService } from './property-seed.service';

describe('PropertySeedService', () => {
  it('does not reseed existing data', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn(),
    } as any;

    const service = new PropertySeedService(repo);
    await service.onModuleInit();

    expect(repo.findOne).toHaveBeenCalledWith('property-1', '1.1');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('seeds when record missing', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    } as any;

    const service = new PropertySeedService(repo);
    await service.onModuleInit();

    expect(repo.create).toHaveBeenCalled();
  });
});
