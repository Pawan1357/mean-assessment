import { Injectable } from '@nestjs/common';
import { UpsertBrokerDto } from '../dto/broker.dto';
import { PropertiesService } from '../../properties/services/properties.service';

@Injectable()
export class BrokersService {
  constructor(private readonly propertiesService: PropertiesService) {}

  createBroker(propertyId: string, version: string, expectedRevision: number, dto: UpsertBrokerDto) {
    return this.propertiesService.createBroker(propertyId, version, expectedRevision, dto);
  }

  updateBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number, dto: UpsertBrokerDto) {
    return this.propertiesService.updateBroker(propertyId, version, brokerId, expectedRevision, dto);
  }

  softDeleteBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number) {
    return this.propertiesService.softDeleteBroker(propertyId, version, brokerId, expectedRevision);
  }
}
