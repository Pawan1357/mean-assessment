import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import {
  SaveAsVersionDto,
  SavePropertyVersionDto,
  UpsertBrokerDto,
  UpsertTenantDto,
} from '../dto/property.dto';
import { PropertiesService } from '../services/properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get(':propertyId/versions')
  listVersions(@Param('propertyId') propertyId: string) {
    return this.propertiesService.listVersions(propertyId);
  }

  @Get(':propertyId/versions/:version')
  getVersion(@Param('propertyId') propertyId: string, @Param('version') version: string) {
    return this.propertiesService.getVersion(propertyId, version);
  }

  @Get(':propertyId/versions/:version/audit-logs')
  listAudit(@Param('propertyId') propertyId: string, @Param('version') version: string) {
    return this.propertiesService.listAudit(propertyId, version);
  }

  @Put(':propertyId/versions/:version')
  saveCurrentVersion(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Body() dto: SavePropertyVersionDto,
  ) {
    return this.propertiesService.saveCurrentVersion(propertyId, version, dto);
  }

  @Post(':propertyId/versions/:version/save-as')
  saveAsNextVersion(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Body() dto: SaveAsVersionDto,
  ) {
    return this.propertiesService.saveAsNextVersion(propertyId, version, dto);
  }

  @Post(':propertyId/versions/:version/brokers')
  createBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertBrokerDto,
  ) {
    return this.propertiesService.createBroker(propertyId, version, expectedRevision, dto);
  }

  @Put(':propertyId/versions/:version/brokers/:brokerId')
  updateBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('brokerId') brokerId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertBrokerDto,
  ) {
    return this.propertiesService.updateBroker(propertyId, version, brokerId, expectedRevision, dto);
  }

  @Delete(':propertyId/versions/:version/brokers/:brokerId')
  @HttpCode(200)
  softDeleteBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('brokerId') brokerId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
  ) {
    return this.propertiesService.softDeleteBroker(propertyId, version, brokerId, expectedRevision);
  }

  @Post(':propertyId/versions/:version/tenants')
  createTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertTenantDto,
  ) {
    return this.propertiesService.createTenant(propertyId, version, expectedRevision, dto);
  }

  @Put(':propertyId/versions/:version/tenants/:tenantId')
  updateTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('tenantId') tenantId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertTenantDto,
  ) {
    return this.propertiesService.updateTenant(propertyId, version, tenantId, expectedRevision, dto);
  }

  @Delete(':propertyId/versions/:version/tenants/:tenantId')
  @HttpCode(200)
  softDeleteTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('tenantId') tenantId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
  ) {
    return this.propertiesService.softDeleteTenant(propertyId, version, tenantId, expectedRevision);
  }
}
