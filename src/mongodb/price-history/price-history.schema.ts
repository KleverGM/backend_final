import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceHistoryDocument = PriceHistory & Document;

@Schema({ timestamps: true })
export class PriceHistory {
  @Prop({ required: true })
  motorcycleId: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: Number })
  previousPrice: number;

  @Prop({ required: true })
  changeType: string; // 'increase', 'decrease', 'initial'

  @Prop({ type: Number })
  changeAmount: number;

  @Prop({ type: Number })
  changePercentage: number;

  @Prop()
  reason: string; // 'market_adjustment', 'promotion', 'cost_change', etc.

  @Prop()
  updatedBy: string; // User ID who made the change

  @Prop()
  notes: string;

  @Prop({ default: Date.now })
  effectiveDate: Date;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);
