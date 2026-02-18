import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PropertyVersionDocument = HydratedDocument<PropertyVersion>;

@Schema({ _id: false })
class BrokerSchemaClass {
  @Prop({ required: true })
  id!: string;
  @Prop({ required: true })
  name!: string;
  @Prop({ required: true })
  phone!: string;
  @Prop({ required: true })
  email!: string;
  @Prop({ required: true })
  company!: string;
  @Prop({ required: true })
  isDeleted!: boolean;
  @Prop()
  deletedAt?: string;
  @Prop()
  deletedBy?: string;
}

@Schema({ _id: false })
class TenantSchemaClass {
  @Prop({ required: true })
  id!: string;
  @Prop({ required: true })
  tenantName!: string;
  @Prop({ required: true })
  creditType!: string;
  @Prop({ required: true })
  squareFeet!: number;
  @Prop({ required: true })
  rentPsf!: number;
  @Prop({ required: true })
  annualEscalations!: number;
  @Prop({ required: true })
  leaseStart!: string;
  @Prop({ required: true })
  leaseEnd!: string;
  @Prop({ required: true })
  leaseType!: string;
  @Prop({ required: true })
  renew!: string;
  @Prop({ required: true })
  downtimeMonths!: number;
  @Prop({ required: true })
  tiPsf!: number;
  @Prop({ required: true })
  lcPsf!: number;
  @Prop({ required: true })
  isVacant!: boolean;
  @Prop({ required: true })
  isDeleted!: boolean;
  @Prop()
  deletedAt?: string;
  @Prop()
  deletedBy?: string;
}

@Schema({ _id: false })
class PropertyDetailsSchemaClass {
  @Prop({ required: true })
  address!: string;
  @Prop({ required: true })
  market!: string;
  @Prop({ required: true })
  subMarket!: string;
  @Prop({ required: true })
  propertyType!: string;
  @Prop({ required: true })
  propertySubType!: string;
  @Prop({ required: true })
  zoning!: string;
  @Prop({ required: true })
  zoningDetails!: string;
  @Prop({ required: true })
  listingType!: string;
  @Prop({ required: true })
  businessPlan!: string;
  @Prop({ required: true })
  sellerType!: string;
  @Prop({ required: true })
  lastTradePrice!: number;
  @Prop({ required: true })
  lastTradeDate!: string;
  @Prop({ required: true })
  askingPrice!: number;
  @Prop({ required: true })
  bidAmount!: number;
  @Prop({ required: true })
  yearOneCapRate!: number;
  @Prop({ required: true })
  stabilizedCapRate!: number;
  @Prop({ required: true })
  vintage!: number;
  @Prop({ required: true })
  buildingSizeSf!: number;
  @Prop({ required: true })
  warehouseSf!: number;
  @Prop({ required: true })
  officeSf!: number;
  @Prop({ required: true })
  propertySizeAcres!: number;
  @Prop({ required: true })
  coverageRatio!: number;
  @Prop({ required: true })
  outdoorStorage!: string;
  @Prop({ required: true })
  constructionType!: string;
  @Prop({ required: true })
  clearHeightFt!: number;
  @Prop({ required: true })
  dockDoors!: number;
  @Prop({ required: true })
  driveInDoors!: number;
  @Prop({ required: true })
  heavyPower!: string;
  @Prop({ required: true })
  sprinklerType!: string;
}

@Schema({ _id: false })
class UnderwritingInputsSchemaClass {
  @Prop({ required: true })
  listPrice!: number;
  @Prop({ required: true })
  bid!: number;
  @Prop({ required: true })
  gpEquityStack!: number;
  @Prop({ required: true })
  lpEquityStack!: number;
  @Prop({ required: true })
  acqFee!: number;
  @Prop({ required: true })
  amFee!: number;
  @Prop({ required: true })
  promote!: number;
  @Prop({ required: true })
  prefHurdle!: number;
  @Prop({ required: true })
  propMgmtFee!: number;
  @Prop({ required: true })
  estStartDate!: string;
  @Prop({ required: true })
  holdPeriodYears!: number;
  @Prop({ required: true })
  closingCostsPct!: number;
  @Prop({ required: true })
  saleCostsPct!: number;
  @Prop({ required: true })
  vacancyPct!: number;
  @Prop({ required: true })
  annualCapexReservesPct!: number;
  @Prop({ required: true })
  annualAdminExpPct!: number;
  @Prop({ required: true })
  expenseInflationPct!: number;
  @Prop({ required: true })
  exitCapRate!: number;
}

@Schema({ collection: 'property_versions', timestamps: true })
export class PropertyVersion {
  @Prop({ required: true, index: true })
  propertyId!: string;

  @Prop({ required: true })
  version!: string;

  @Prop({ required: true })
  isLatest!: boolean;

  @Prop({ required: true })
  isHistorical!: boolean;

  @Prop({ required: true })
  revision!: number;

  @Prop({ type: PropertyDetailsSchemaClass, required: true })
  propertyDetails!: PropertyDetailsSchemaClass;

  @Prop({ type: UnderwritingInputsSchemaClass, required: true })
  underwritingInputs!: UnderwritingInputsSchemaClass;

  @Prop({ type: [BrokerSchemaClass], required: true, default: [] })
  brokers!: BrokerSchemaClass[];

  @Prop({ type: [TenantSchemaClass], required: true, default: [] })
  tenants!: TenantSchemaClass[];

  @Prop({ required: true })
  updatedBy!: string;
}

export const PropertyVersionSchema = SchemaFactory.createForClass(PropertyVersion);
PropertyVersionSchema.index({ propertyId: 1, version: 1 }, { unique: true });
