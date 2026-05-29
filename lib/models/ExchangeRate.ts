import mongoose, { Schema, Document } from 'mongoose';

export interface IExchangeRateSnapshot extends Document {
  fetchedAt: Date;
  base: string;
  rates: Map<string, number>;
}

const ExchangeRateSnapshotSchema = new Schema<IExchangeRateSnapshot>(
  {
    fetchedAt: { type: Date, required: true, index: true },
    base: { type: String, required: true, default: 'USD' },
    rates: { type: Map, of: Number, required: true },
  },
  { timestamps: false }
);

export const ExchangeRateSnapshot =
  mongoose.models.ExchangeRateSnapshot ||
  mongoose.model<IExchangeRateSnapshot>('ExchangeRateSnapshot', ExchangeRateSnapshotSchema);
