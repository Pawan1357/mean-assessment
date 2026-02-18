import { BrokersService } from './brokers.service';

describe('BrokersService', () => {
  const propertyRepository = {
    findOne: jest.fn(),
    saveCurrentVersionAtomic: jest.fn(),
  } as any;

  const auditRepository = {
    create: jest.fn(),
  } as any;

  const service = new BrokersService(propertyRepository, auditRepository);

  const baseEntity = {
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
    brokers: [
      {
        id: 'b1',
        name: 'Broker One',
        phone: '1',
        email: 'one@example.com',
        company: 'A',
        isDeleted: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and updates brokers', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });

    await service.createBroker('property-1', '1.1', 2, {
      name: 'New Broker',
      phone: '123',
      email: 'new@example.com',
      company: 'C',
    });

    await service.updateBroker('property-1', '1.1', 'b1', 2, {
      name: 'Broker Updated',
      phone: '123',
      email: 'new@example.com',
      company: 'C',
    });

    expect(propertyRepository.saveCurrentVersionAtomic).toHaveBeenCalledTimes(2);
  });

  it('soft deletes broker', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });

    await service.softDeleteBroker('property-1', '1.1', 'b1', 2);
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROKER_DELETE_SOFT' }));
  });

  it('rejects invalid mutable operations', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.updateBroker('property-1', '1.1', 'b1', 1, {
        name: 'Broker Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    await expect(
      service.updateBroker('property-1', '1.1', 'missing-broker', 2, {
        name: 'Broker Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects update when persistence fails', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);

    await expect(
      service.updateBroker('property-1', '1.1', 'b1', 2, {
        name: 'Broker Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
