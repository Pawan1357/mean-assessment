import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class TenantSchemaClass {
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
