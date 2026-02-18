import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const propertyRepository = {
    findOne: jest.fn(),
    saveCurrentVersionAtomic: jest.fn(),
  } as any;

  const auditRepository = {
    create: jest.fn(),
  } as any;

  const service = new TenantsService(propertyRepository, auditRepository);

  const baseEntity = {
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
    propertyDetails: {
      buildingSizeSf: 1000,
    },
    underwritingInputs: {
      estStartDate: '2025-01-01',
      holdPeriodYears: 5,
    },
    tenants: [
      {
        id: 't1',
        tenantName: 'Tenant One',
        creditType: 'National',
        squareFeet: 300,
        rentPsf: 20,
        annualEscalations: 2,
        leaseStart: '2025-01-02',
        leaseEnd: '2027-01-01',
        leaseType: 'NNN',
        renew: 'Yes',
        downtimeMonths: 0,
        tiPsf: 0,
        lcPsf: 0,
        isVacant: false,
        isDeleted: false,
      },
      {
        id: 'vacant-row',
        tenantName: 'VACANT',
        creditType: 'N/A',
        squareFeet: 700,
        rentPsf: 0,
        annualEscalations: 0,
        leaseStart: '2025-01-02',
        leaseEnd: '2027-01-01',
        leaseType: 'N/A',
        renew: 'N/A',
        downtimeMonths: 0,
        tiPsf: 0,
        lcPsf: 0,
        isVacant: true,
        isDeleted: false,
      },
    ],
  };

  const payload = {
    tenantName: 'T2',
    creditType: 'Regional',
    squareFeet: 100,
    rentPsf: 10,
    annualEscalations: 1,
    leaseStart: '2025-02-02',
    leaseEnd: '2026-02-02',
    leaseType: 'Gross',
    renew: 'No',
    downtimeMonths: 0,
    tiPsf: 0,
    lcPsf: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates, updates and soft deletes tenant', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });

    await service.createTenant('property-1', '1.1', 2, payload as any);
    await service.updateTenant('property-1', '1.1', 't1', 2, payload as any);
    await service.softDeleteTenant('property-1', '1.1', 't1', 2);

    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'TENANT_DELETE_SOFT' }));
  });

  it('rejects update/delete for vacant row id', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(service.updateTenant('property-1', '1.1', 'vacant-row', 2, payload as any)).rejects.toMatchObject({
      code: 'VALIDATION',
    });

    await expect(service.softDeleteTenant('property-1', '1.1', 'vacant-row', 2)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects tenant update when tenant is missing', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(service.updateTenant('property-1', '1.1', 'missing-tenant', 2, payload as any)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects conflict scenarios', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(service.updateTenant('property-1', '1.1', 't1', 1, payload as any)).rejects.toMatchObject({ code: 'CONFLICT' });

    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);
    await expect(service.softDeleteTenant('property-1', '1.1', 't1', 2)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
