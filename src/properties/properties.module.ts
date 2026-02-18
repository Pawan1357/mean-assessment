import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './controllers/properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertySeedService } from './services/property-seed.service';
import { PropertyRepository } from './repositories/property.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { PropertyVersion, PropertyVersionSchema } from './schemas/property-version.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyVersion.name, schema: PropertyVersionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertySeedService, PropertyRepository, AuditLogRepository],
  exports: [PropertiesService, PropertyRepository, AuditLogRepository],
})
export class PropertiesModule {}
