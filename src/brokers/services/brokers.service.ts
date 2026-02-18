import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppException } from '../../common/exceptions/app.exception';
import { AuditLogRepository } from '../../properties/repositories/audit-log.repository';
import { PropertyRepository } from '../../properties/repositories/property.repository';
import { buildDiff } from '../../properties/utils/diff.util';
import { BrokerDto, UpsertBrokerDto } from '../dto/broker.dto';

@Injectable()
export class BrokersService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async createBroker(propertyId: string, version: string, expectedRevision: number, dto: UpsertBrokerDto) {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);

    const brokers = [...entity.brokers, { ...dto, id: randomUUID(), isDeleted: false }];
    return this.updateBrokersWithAudit(entity, brokers, 'BROKER_CREATE');
  }

  async updateBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number, dto: UpsertBrokerDto) {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);
    this.assertBrokerMutable(entity.brokers, brokerId, 'update');

    const brokers = entity.brokers.map((broker: BrokerDto) => (broker.id === brokerId ? { ...broker, ...dto } : broker));
    return this.updateBrokersWithAudit(entity, brokers, 'BROKER_UPDATE');
  }

  async softDeleteBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number) {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);
    this.assertBrokerMutable(entity.brokers, brokerId, 'delete');

    const now = new Date().toISOString();
    const brokers = entity.brokers.map((broker: BrokerDto) =>
      broker.id === brokerId
        ? {
            ...broker,
            isDeleted: true,
            deletedAt: now,
            deletedBy: 'mock.user@assessment.local',
          }
        : broker,
    );
    return this.updateBrokersWithAudit(entity, brokers, 'BROKER_DELETE_SOFT');
  }

  private assertRevision(currentRevision: number, expectedRevision: number) {
    if (currentRevision !== expectedRevision) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }
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

  private assertBrokerMutable(brokers: BrokerDto[], brokerId: string, operation: 'update' | 'delete') {
    const broker = brokers.find((candidate) => candidate.id === brokerId);
    if (!broker) {
      throw new AppException('Broker not found', 'NOT_FOUND');
    }
    if (broker.isDeleted) {
      throw new AppException(`Cannot ${operation} a soft-deleted broker`, 'VALIDATION');
    }
  }

  private async updateBrokersWithAudit(entity: any, brokers: BrokerDto[], action: string) {
    const updated = await this.propertyRepository.saveCurrentVersionAtomic(entity.propertyId, entity.version, entity.revision, {
      brokers,
      updatedBy: 'mock.user@assessment.local',
    });

    if (!updated) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }

    const changes = buildDiff({ brokers: entity.brokers }, { brokers });
    await this.auditRepository.create({
      propertyId: entity.propertyId,
      version: entity.version,
      revision: updated.revision,
      updatedBy: 'mock.user@assessment.local',
      action,
      changes,
      changedFieldCount: changes.length,
    });

    return updated.toObject();
  }
}
