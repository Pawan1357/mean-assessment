import { AppException } from '../../common/exceptions/app.exception';
import { PropertiesService } from './properties.service';

describe('PropertiesService', () => {
  const propertyRepository = {
    findOne: jest.fn(),
    saveCurrentVersionAtomic: jest.fn(),
    markLatestAsHistorical: jest.fn(),
    create: jest.fn(),
    listVersions: jest.fn(),
  } as any;

  const auditRepository = {
    create: jest.fn(),
    list: jest.fn(),
  } as any;

  const service = new PropertiesService(propertyRepository, auditRepository);

  const baseEntity = {
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
    propertyDetails: {
      address: '504 N Ashe Ave',
      buildingSizeSf: 1000,
    },
    underwritingInputs: {
      estStartDate: '2025-01-01',
      holdPeriodYears: 5,
    },
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns version when found', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    await expect(service.getVersion('property-1', '1.1')).resolves.toEqual(baseEntity);
  });

  it('throws not found when version missing', async () => {
    propertyRepository.findOne.mockResolvedValue(null);
    await expect(service.getVersion('property-1', '1.1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('passes through list versions and audit', async () => {
    propertyRepository.listVersions.mockResolvedValue([{ version: '1.1' }]);
    auditRepository.list.mockResolvedValue([{ action: 'UPDATE_VERSION' }]);

    await expect(service.listVersions('property-1')).resolves.toEqual([{ version: '1.1' }]);
    await expect(service.listAudit('property-1', '1.1')).resolves.toEqual([{ action: 'UPDATE_VERSION' }]);
  });

  it('saves current version and writes audit', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({
      revision: 3,
      toObject: () => ({ ...baseEntity, revision: 3 }),
    });

    const dto = {
      expectedRevision: 2,
      propertyDetails: { ...baseEntity.propertyDetails },
      underwritingInputs: { ...baseEntity.underwritingInputs },
      brokers: [...baseEntity.brokers],
      tenants: baseEntity.tenants.filter((t: any) => !t.isVacant),
    } as any;

    const result = await service.saveCurrentVersion('property-1', '1.1', dto);
    expect(result.revision).toBe(3);
    expect(propertyRepository.saveCurrentVersionAtomic).toHaveBeenCalled();
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE_VERSION', updatedBy: 'mock.user@assessment.local' }));
  });

  it('rejects save when historical version', async () => {
    propertyRepository.findOne.mockResolvedValue({ ...baseEntity, isHistorical: true });
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [],
        tenants: [],
      } as any),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects address mutation', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails, address: 'changed' },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [],
        tenants: [],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects revision mismatch on save', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 1,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [...baseEntity.brokers],
        tenants: baseEntity.tenants.filter((t: any) => !t.isVacant),
      } as any),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('enforces tenant square footage rule', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails, buildingSizeSf: 100 },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [...baseEntity.brokers],
        tenants: [{ ...baseEntity.tenants[0], squareFeet: 300 }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('enforces lease start rule', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs, estStartDate: '2026-01-01' },
        brokers: [...baseEntity.brokers],
        tenants: [{ ...baseEntity.tenants[0] }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('enforces lease end hold-period rule', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs, holdPeriodYears: 1 },
        brokers: [...baseEntity.brokers],
        tenants: [{ ...baseEntity.tenants[0], leaseEnd: '2030-01-01' }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save-as clones next semantic version', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.listVersions.mockResolvedValue([
      { version: '1.1' },
      { version: '1.3' },
      { version: '1.2' },
    ]);
    propertyRepository.create.mockResolvedValue({ toObject: () => ({ ...baseEntity, version: '1.4', revision: 0 }) });

    const result = await service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 });
    expect(result.version).toBe('1.4');
    expect(propertyRepository.markLatestAsHistorical).toHaveBeenCalledWith('property-1');
    expect(propertyRepository.create).toHaveBeenCalledWith(expect.objectContaining({ version: '1.4' }));
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'SAVE_AS' }));
  });

  it('save-as rejects revision mismatch', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    await expect(service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 1 })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('save-as can create new version from unsaved draft payload without mutating current version', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.listVersions.mockResolvedValue([{ version: '1.1' }]);
    propertyRepository.create.mockResolvedValue({
      toObject: () => ({
        ...baseEntity,
        version: '1.2',
        revision: 0,
        propertyDetails: { ...baseEntity.propertyDetails, market: 'Draft Market' },
      }),
    });

    const result = await service.saveAsNextVersion('property-1', '1.1', {
      expectedRevision: 2,
      propertyDetails: { ...baseEntity.propertyDetails, market: 'Draft Market' },
      underwritingInputs: { ...baseEntity.underwritingInputs },
      brokers: [...baseEntity.brokers],
      tenants: baseEntity.tenants.map((tenant: any) => ({ ...tenant })),
    } as any);

    expect(result.version).toBe('1.2');
    expect(propertyRepository.saveCurrentVersionAtomic).not.toHaveBeenCalled();
    expect(propertyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyDetails: expect.objectContaining({ market: 'Draft Market' }),
      }),
    );
  });

  it('save-as rejects partial draft payload', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    await expect(
      service.saveAsNextVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
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

  it('creates, updates and soft deletes tenant', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });

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

    await service.createTenant('property-1', '1.1', 2, payload as any);
    await service.updateTenant('property-1', '1.1', 't1', 2, payload as any);
    await service.softDeleteTenant('property-1', '1.1', 't1', 2);

    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'TENANT_DELETE_SOFT' }));
  });

  it('throws conflict on explicit revision mismatch during broker update path', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    await expect(
      service.updateBroker('property-1', '1.1', 'b1', 1, {
        name: 'Broker Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('throws conflict when update helper cannot persist', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);

    await expect(
      service.softDeleteTenant('property-1', '1.1', 't1', 2),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects broker update when broker is missing', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.updateBroker('property-1', '1.1', 'missing-broker', 2, {
        name: 'Broker Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects tenant update/delete for vacant row id', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.updateTenant('property-1', '1.1', 'vacant-row', 2, {
        tenantName: 'Should Fail',
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
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    await expect(service.softDeleteTenant('property-1', '1.1', 'vacant-row', 2)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects tenant update when tenant is missing', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.updateTenant('property-1', '1.1', 'missing-tenant', 2, {
        tenantName: 'Should Fail',
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
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects save payload when broker ids are duplicated', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [
          { ...baseEntity.brokers[0], id: 'dup' },
          { ...baseEntity.brokers[0], id: 'dup' },
        ],
        tenants: [{ ...baseEntity.tenants[0] }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects save payload when non-vacant tenant ids are duplicated', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [...baseEntity.brokers],
        tenants: [
          { ...baseEntity.tenants[0], id: 'dup', isVacant: false },
          { ...baseEntity.tenants[0], id: 'dup', isVacant: false },
        ],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects save payload when vacant-row id is provided as non-vacant', async () => {
    propertyRepository.findOne.mockResolvedValue(baseEntity);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseEntity.propertyDetails },
        underwritingInputs: { ...baseEntity.underwritingInputs },
        brokers: [...baseEntity.brokers],
        tenants: [{ ...baseEntity.tenants[0], id: 'vacant-row', isVacant: false }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects broker delete when broker is already soft-deleted', async () => {
    propertyRepository.findOne.mockResolvedValue({
      ...baseEntity,
      brokers: [{ ...baseEntity.brokers[0], isDeleted: true }],
    });

    await expect(service.softDeleteBroker('property-1', '1.1', 'b1', 2)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects tenant update when matched tenant is already deleted', async () => {
    propertyRepository.findOne.mockResolvedValue({
      ...baseEntity,
      tenants: [{ ...baseEntity.tenants[0], isDeleted: true }, ...baseEntity.tenants.slice(1)],
    });

    await expect(
      service.updateTenant('property-1', '1.1', 't1', 2, {
        tenantName: 'Should Fail',
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
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('returns not found when editing missing version through mutable operations', async () => {
    propertyRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createBroker('property-1', '1.1', 0, {
        name: 'New Broker',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws conflict when broker update helper cannot persist', async () => {
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

  it('propagates AppException class', () => {
    const err = new AppException('x', 'CONFLICT');
    expect(err).toBeInstanceOf(AppException);
    expect(err.code).toBe('CONFLICT');
  });
});
