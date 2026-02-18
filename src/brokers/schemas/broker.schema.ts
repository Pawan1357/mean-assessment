import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class BrokerSchemaClass {
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
