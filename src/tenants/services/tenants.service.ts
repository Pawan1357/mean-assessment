import { Injectable } from '@nestjs/common';
import { UpsertTenantDto } from '../../properties/dto/property.dto';
import { PropertiesService } from '../../properties/services/properties.service';

@Injectable()
export class TenantsService {
  constructor(private readonly propertiesService: PropertiesService) {}

  createTenant(propertyId: string, version: string, expectedRevision: number, dto: UpsertTenantDto) {
    return this.propertiesService.createTenant(propertyId, version, expectedRevision, dto);
  }

  updateTenant(propertyId: string, version: string, tenantId: string, expectedRevision: number, dto: UpsertTenantDto) {
    return this.propertiesService.updateTenant(propertyId, version, tenantId, expectedRevision, dto);
  }

  softDeleteTenant(propertyId: string, version: string, tenantId: string, expectedRevision: number) {
    return this.propertiesService.softDeleteTenant(propertyId, version, tenantId, expectedRevision);
  }
}
