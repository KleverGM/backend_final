import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true })
  action: string; // 'create', 'update', 'delete', 'login', 'logout', etc.

  @Prop({ required: true })
  resource: string; // 'motorcycle', 'customer', 'sale', 'inventory', etc.

  @Prop()
  resourceId: string;

  @Prop({ type: Object })
  details: {
    previousData?: any;
    newData?: any;
    changes?: string[];
    metadata?: any;
  };

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  success: boolean;

  @Prop()
  errorMessage: string;

  @Prop()
  sessionId: string;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
