import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class BrokerDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsBoolean()
  isDeleted!: boolean;
}

export class TenantDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  creditType!: string;

  @IsNumber()
  @Min(0)
  squareFeet!: number;

  @IsNumber()
  @Min(0)
  rentPsf!: number;

  @IsNumber()
  @Min(0)
  annualEscalations!: number;

  @IsDateString()
  leaseStart!: string;

  @IsDateString()
  leaseEnd!: string;

  @IsString()
  leaseType!: string;

  @IsString()
  renew!: string;

  @IsInt()
  @Min(0)
  downtimeMonths!: number;

  @IsNumber()
  @Min(0)
  tiPsf!: number;

  @IsNumber()
  @Min(0)
  lcPsf!: number;

  @IsBoolean()
  isVacant!: boolean;

  @IsBoolean()
  isDeleted!: boolean;
}

export class PropertyDetailsDto {
  @IsString()
  address!: string;

  @IsString()
  market!: string;

  @IsString()
  subMarket!: string;

  @IsString()
  propertyType!: string;

  @IsString()
  propertySubType!: string;

  @IsString()
  zoning!: string;

  @IsString()
  zoningDetails!: string;

  @IsString()
  listingType!: string;

  @IsString()
  businessPlan!: string;

  @IsString()
  sellerType!: string;

  @IsNumber()
  @Min(0)
  lastTradePrice!: number;

  @IsDateString()
  lastTradeDate!: string;

  @IsNumber()
  @Min(0)
  askingPrice!: number;

  @IsNumber()
  @Min(0)
  bidAmount!: number;

  @IsNumber()
  yearOneCapRate!: number;

  @IsNumber()
  stabilizedCapRate!: number;

  @IsInt()
  vintage!: number;

  @IsNumber()
  @Min(0)
  buildingSizeSf!: number;

  @IsNumber()
  @Min(0)
  warehouseSf!: number;

  @IsNumber()
  @Min(0)
  officeSf!: number;

  @IsNumber()
  @Min(0)
  propertySizeAcres!: number;

  @IsNumber()
  @Min(0)
  coverageRatio!: number;

  @IsString()
  outdoorStorage!: string;

  @IsString()
  constructionType!: string;

  @IsNumber()
  @Min(0)
  clearHeightFt!: number;

  @IsInt()
  @Min(0)
  dockDoors!: number;

  @IsInt()
  @Min(0)
  driveInDoors!: number;

  @IsString()
  heavyPower!: string;

  @IsString()
  sprinklerType!: string;
}

export class UnderwritingInputsDto {
  @IsNumber()
  @Min(0)
  listPrice!: number;

  @IsNumber()
  @Min(0)
  bid!: number;

  @IsNumber()
  @Min(0)
  gpEquityStack!: number;

  @IsNumber()
  @Min(0)
  lpEquityStack!: number;

  @IsNumber()
  @Min(0)
  acqFee!: number;

  @IsNumber()
  @Min(0)
  amFee!: number;

  @IsNumber()
  @Min(0)
  promote!: number;

  @IsNumber()
  @Min(0)
  prefHurdle!: number;

  @IsNumber()
  @Min(0)
  propMgmtFee!: number;

  @IsDateString()
  estStartDate!: string;

  @IsInt()
  @IsPositive()
  holdPeriodYears!: number;

  @IsNumber()
  @Min(0)
  closingCostsPct!: number;

  @IsNumber()
  @Min(0)
  saleCostsPct!: number;

  @IsNumber()
  @Min(0)
  vacancyPct!: number;

  @IsNumber()
  @Min(0)
  annualCapexReservesPct!: number;

  @IsNumber()
  @Min(0)
  annualAdminExpPct!: number;

  @IsNumber()
  @Min(0)
  expenseInflationPct!: number;

  @IsNumber()
  @Min(0)
  exitCapRate!: number;
}

export class SavePropertyVersionDto {
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  propertyDetails!: PropertyDetailsDto;

  @ValidateNested()
  @Type(() => UnderwritingInputsDto)
  underwritingInputs!: UnderwritingInputsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrokerDto)
  brokers!: BrokerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantDto)
  tenants!: TenantDto[];
}

export class SaveAsVersionDto {
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  propertyDetails?: PropertyDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnderwritingInputsDto)
  underwritingInputs?: UnderwritingInputsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrokerDto)
  brokers?: BrokerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantDto)
  tenants?: TenantDto[];
}

export class UpsertBrokerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;
}

export class UpsertTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  creditType!: string;

  @IsNumber()
  @Min(0)
  squareFeet!: number;

  @IsNumber()
  @Min(0)
  rentPsf!: number;

  @IsNumber()
  @Min(0)
  annualEscalations!: number;

  @IsDateString()
  leaseStart!: string;

  @IsDateString()
  leaseEnd!: string;

  @IsString()
  leaseType!: string;

  @IsString()
  renew!: string;

  @IsInt()
  @Min(0)
  downtimeMonths!: number;

  @IsNumber()
  @Min(0)
  tiPsf!: number;

  @IsNumber()
  @Min(0)
  lcPsf!: number;
}
