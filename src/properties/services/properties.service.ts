import { Injectable } from '@nestjs/common';
import { BrokerDto } from '../../brokers/dto/broker.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { TenantDto } from '../../tenants/dto/tenant.dto';
import { SaveAsVersionDto } from '../dto/save-as-version.dto';
import { SavePropertyVersionDto } from '../dto/save-property-version.dto';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { PropertyRepository } from '../repositories/property.repository';
import { buildDiff } from '../utils/diff.util';
import { incrementSemanticVersion } from '../utils/version.util';

const MOCK_USER = 'mock.user@assessment.local';
const VACANT_TENANT_ID = 'vacant-row';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async getVersion(propertyId: string, version: string) {
    const entity = await this.propertyRepository.findOne(propertyId, version);
    if (!entity) {
      throw new AppException('Property version not found', 'NOT_FOUND');
    }
    return entity;
  }

  listVersions(propertyId: string) {
    return this.propertyRepository.listVersions(propertyId);
  }

  listAudit(propertyId: string, version: string) {
    return this.auditRepository.list(propertyId, version);
  }

  async saveCurrentVersion(propertyId: string, version: string, dto: SavePropertyVersionDto) {
    const existing = await this.assertEditableVersion(propertyId, version);

    if (existing.propertyDetails.address !== dto.propertyDetails.address) {
      throw new AppException('Property address is read-only', 'VALIDATION');
    }
    this.validateSavePayloadIntegrity(dto.brokers, dto.tenants);

    const normalizedTenants = this.normalizeTenants(dto.tenants, dto.propertyDetails.buildingSizeSf);
    this.validateBusinessRules(dto.propertyDetails.buildingSizeSf, dto.underwritingInputs.estStartDate, dto.underwritingInputs.holdPeriodYears, normalizedTenants);

    const payload = {
      propertyDetails: dto.propertyDetails,
      underwritingInputs: dto.underwritingInputs,
      brokers: this.normalizeBrokers(dto.brokers),
      tenants: normalizedTenants,
      updatedBy: MOCK_USER,
    };

    const updated = await this.propertyRepository.saveCurrentVersionAtomic(propertyId, version, dto.expectedRevision, payload);
    if (!updated) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }

    const changes = buildDiff(
      {
        propertyDetails: existing.propertyDetails,
        underwritingInputs: existing.underwritingInputs,
        brokers: existing.brokers,
        tenants: existing.tenants,
      },
      {
        propertyDetails: payload.propertyDetails,
        underwritingInputs: payload.underwritingInputs,
        brokers: payload.brokers,
        tenants: payload.tenants,
      },
    );

    await this.auditRepository.create({
      propertyId,
      version,
      revision: updated.revision,
      updatedBy: MOCK_USER,
      action: 'UPDATE_VERSION',
      changes,
      changedFieldCount: changes.length,
    });

    return updated.toObject();
  }

  async saveAsNextVersion(propertyId: string, sourceVersion: string, dto: SaveAsVersionDto) {
    const source = await this.getVersion(propertyId, sourceVersion);
    if (source.revision !== dto.expectedRevision) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }

    const saveAsSnapshot = this.resolveSaveAsSnapshot(source, dto);
    const nextVersion = await this.resolveNextVersion(propertyId);
    await this.propertyRepository.markLatestAsHistorical(propertyId);

    const created = await this.propertyRepository.create({
      propertyId,
      version: nextVersion,
      isLatest: true,
      isHistorical: false,
      revision: 0,
      propertyDetails: saveAsSnapshot.propertyDetails,
      underwritingInputs: saveAsSnapshot.underwritingInputs,
      brokers: saveAsSnapshot.brokers,
      tenants: saveAsSnapshot.tenants,
      updatedBy: MOCK_USER,
    });

    await this.auditRepository.create({
      propertyId,
      version: nextVersion,
      revision: 0,
      updatedBy: MOCK_USER,
      action: 'SAVE_AS',
      changes: [{ field: 'version', oldValue: sourceVersion, newValue: nextVersion }],
      changedFieldCount: 1,
    });

    return created.toObject();
  }

  private resolveSaveAsSnapshot(source: any, dto: SaveAsVersionDto) {
    const hasAnyDraftFields = !!(dto.propertyDetails || dto.underwritingInputs || dto.brokers || dto.tenants);
    if (!hasAnyDraftFields) {
      return {
        propertyDetails: source.propertyDetails,
        underwritingInputs: source.underwritingInputs,
        brokers: source.brokers,
        tenants: source.tenants,
      };
    }

    if (!dto.propertyDetails || !dto.underwritingInputs || !dto.brokers || !dto.tenants) {
      throw new AppException(
        'Save As with form changes requires propertyDetails, underwritingInputs, brokers and tenants',
        'VALIDATION',
      );
    }

    if (source.propertyDetails.address !== dto.propertyDetails.address) {
      throw new AppException('Property address is read-only', 'VALIDATION');
    }

    this.validateSavePayloadIntegrity(dto.brokers, dto.tenants);
    const normalizedTenants = this.normalizeTenants(dto.tenants, dto.propertyDetails.buildingSizeSf);
    this.validateBusinessRules(
      dto.propertyDetails.buildingSizeSf,
      dto.underwritingInputs.estStartDate,
      dto.underwritingInputs.holdPeriodYears,
      normalizedTenants,
    );

    return {
      propertyDetails: dto.propertyDetails,
      underwritingInputs: dto.underwritingInputs,
      brokers: this.normalizeBrokers(dto.brokers),
      tenants: normalizedTenants,
    };
  }

  private async resolveNextVersion(propertyId: string): Promise<string> {
    const versions = await this.propertyRepository.listVersions(propertyId);
    if (versions.length === 0) {
      throw new AppException('Cannot create next version for unknown property', 'NOT_FOUND');
    }

    let latestVersion = versions[0].version;
    let latestScore = this.semanticVersionScore(latestVersion);

    for (const candidate of versions.slice(1)) {
      const candidateScore = this.semanticVersionScore(candidate.version);
      if (candidateScore > latestScore) {
        latestScore = candidateScore;
        latestVersion = candidate.version;
      }
    }

    return incrementSemanticVersion(latestVersion);
  }

  private semanticVersionScore(version: string): number {
    const [majorRaw, minorRaw] = version.split('.');
    const major = Number(majorRaw);
    const minor = Number(minorRaw);

    if (Number.isNaN(major) || Number.isNaN(minor)) {
      throw new AppException(`Invalid version format: ${version}`, 'VALIDATION');
    }

    return major * 100000 + minor;
  }

  private validateBusinessRules(buildingSizeSf: number, estStartDate: string, holdPeriodYears: number, tenants: TenantDto[]) {
    const activeTenants = tenants.filter((tenant) => !tenant.isVacant && !tenant.isDeleted);
    const totalSqFt = activeTenants.reduce((sum, tenant) => sum + tenant.squareFeet, 0);

    if (totalSqFt > buildingSizeSf) {
      throw new AppException('Total tenant square footage must be <= property space', 'VALIDATION');
    }

    for (const tenant of activeTenants) {
      const leaseStart = new Date(tenant.leaseStart);
      const leaseEnd = new Date(tenant.leaseEnd);
      const propertyStart = new Date(estStartDate);
      const maxLeaseEnd = new Date(leaseStart);
      maxLeaseEnd.setFullYear(maxLeaseEnd.getFullYear() + holdPeriodYears);

      if (leaseStart < propertyStart) {
        throw new AppException('Lease start cannot be before property start', 'VALIDATION');
      }

      if (leaseEnd > maxLeaseEnd) {
        throw new AppException('Lease end cannot exceed start + hold period', 'VALIDATION');
      }
    }
  }

  private normalizeBrokers(brokers: BrokerDto[]) {
    return brokers.map((broker) => ({ ...broker }));
  }

  private validateSavePayloadIntegrity(brokers: BrokerDto[], tenants: TenantDto[]) {
    const brokerIds = brokers.map((broker) => broker.id);
    if (new Set(brokerIds).size !== brokerIds.length) {
      throw new AppException('Broker IDs must be unique', 'VALIDATION');
    }

    const realTenantIds = tenants.filter((tenant) => !tenant.isVacant).map((tenant) => tenant.id);
    if (new Set(realTenantIds).size !== realTenantIds.length) {
      throw new AppException('Tenant IDs must be unique for non-vacant rows', 'VALIDATION');
    }

    const invalidVacantMutations = tenants.filter((tenant) => tenant.id === VACANT_TENANT_ID && !tenant.isVacant);
    if (invalidVacantMutations.length > 0) {
      throw new AppException('Vacant row is system-managed and cannot be modified directly', 'VALIDATION');
    }
  }

  private normalizeTenants(tenants: TenantDto[], propertySf: number) {
    const activeRows = tenants.filter((tenant) => !tenant.isVacant).map((tenant) => ({ ...tenant }));
    const occupiedSf = activeRows.filter((tenant) => !tenant.isDeleted).reduce((sum, tenant) => sum + tenant.squareFeet, 0);
    const vacantSf = Math.max(0, propertySf - occupiedSf);

    const vacantRow: TenantDto = {
      id: VACANT_TENANT_ID,
      tenantName: 'VACANT',
      creditType: 'N/A',
      squareFeet: vacantSf,
      rentPsf: 0,
      annualEscalations: 0,
      leaseStart: activeRows[0]?.leaseStart ?? new Date().toISOString(),
      leaseEnd: activeRows[0]?.leaseEnd ?? new Date().toISOString(),
      leaseType: 'N/A',
      renew: 'N/A',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
      isVacant: true,
      isDeleted: false,
    };

    return [...activeRows, vacantRow];
  }

  private async assertEditableVersion(propertyId: string, version: string) {
    const entity = await this.propertyRepository.findOne(propertyId, version);
    if (!entity) {
      throw new AppException('Property version not found', 'NOT_FOUND');
    }
    if (entity.isHistorical) {
      throw new AppException('Historical versions are read-only', 'CONFLICT');
    }
    return entity;
  }

}
