import { AppException } from '../../common/exceptions/app.exception';
import { PropertiesController } from './properties.controller';

describe('PropertiesController', () => {
  const service = {
    listVersions: jest.fn(),
    getVersion: jest.fn(),
    listAudit: jest.fn(),
    saveCurrentVersion: jest.fn(),
    saveAsNextVersion: jest.fn(),
    createBroker: jest.fn(),
    updateBroker: jest.fn(),
    softDeleteBroker: jest.fn(),
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
    softDeleteTenant: jest.fn(),
  } as any;

  const controller = new PropertiesController(service);

  beforeEach(() => jest.clearAllMocks());

  it('delegates list endpoints', async () => {
    service.listVersions.mockResolvedValue([]);
    service.listAudit.mockResolvedValue([]);

    await expect(controller.listVersions('p1')).resolves.toEqual([]);
    await expect(controller.listAudit('p1', '1.1')).resolves.toEqual([]);
  });

  it('delegates get/save/saveAs endpoints', async () => {
    service.getVersion.mockResolvedValue({ id: 'x' });
    service.saveCurrentVersion.mockResolvedValue({ id: 'x' });
    service.saveAsNextVersion.mockResolvedValue({ id: 'x' });

    await expect(controller.getVersion('p1', '1.1')).resolves.toEqual({ id: 'x' });
    await expect(controller.saveCurrentVersion('p1', '1.1', {} as any)).resolves.toEqual({ id: 'x' });
    await expect(controller.saveAsNextVersion('p1', '1.1', {} as any)).resolves.toEqual({ id: 'x' });
  });

  it('passes service exceptions through for global filter', async () => {
    service.getVersion.mockRejectedValue(new AppException('missing', 'NOT_FOUND'));
    await expect(controller.getVersion('p1', '1.1')).rejects.toBeInstanceOf(AppException);
  });

  it('converts expectedRevision query params and delegates broker actions', async () => {
    service.createBroker.mockResolvedValue({ ok: true });
    service.updateBroker.mockResolvedValue({ ok: true });
    service.softDeleteBroker.mockResolvedValue({ ok: true });

    await controller.createBroker('p1', '1.1', 2, { name: 'n', phone: '1', email: 'a@a.com', company: 'c' });
    await controller.updateBroker('p1', '1.1', 'b1', 2, { name: 'n', phone: '1', email: 'a@a.com', company: 'c' });
    await controller.softDeleteBroker('p1', '1.1', 'b1', 2);

    expect(service.createBroker).toHaveBeenCalledWith('p1', '1.1', 2, expect.any(Object));
    expect(service.updateBroker).toHaveBeenCalledWith('p1', '1.1', 'b1', 2, expect.any(Object));
    expect(service.softDeleteBroker).toHaveBeenCalledWith('p1', '1.1', 'b1', 2);
  });

  it('delegates tenant actions', async () => {
    service.createTenant.mockResolvedValue({ ok: true });
    service.updateTenant.mockResolvedValue({ ok: true });
    service.softDeleteTenant.mockResolvedValue({ ok: true });

    await controller.createTenant('p1', '1.1', 2, {
      tenantName: 't',
      creditType: 'n',
      squareFeet: 1,
      rentPsf: 1,
      annualEscalations: 1,
      leaseStart: '2025-01-01',
      leaseEnd: '2025-12-31',
      leaseType: 'NNN',
      renew: 'No',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
    });
    await controller.updateTenant('p1', '1.1', 't1', 2, {
      tenantName: 't',
      creditType: 'n',
      squareFeet: 1,
      rentPsf: 1,
      annualEscalations: 1,
      leaseStart: '2025-01-01',
      leaseEnd: '2025-12-31',
      leaseType: 'NNN',
      renew: 'No',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
    });
    await controller.softDeleteTenant('p1', '1.1', 't1', 2);

    expect(service.createTenant).toHaveBeenCalledWith('p1', '1.1', 2, expect.any(Object));
    expect(service.updateTenant).toHaveBeenCalledWith('p1', '1.1', 't1', 2, expect.any(Object));
    expect(service.softDeleteTenant).toHaveBeenCalledWith('p1', '1.1', 't1', 2);
  });
});
