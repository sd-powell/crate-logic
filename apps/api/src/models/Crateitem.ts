import mongoose, { type InferSchemaType } from 'mongoose';

const crateItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export type CrateItem = InferSchemaType<typeof crateItemSchema>;

export const CrateItemModel =
  mongoose.models.CrateItem ?? mongoose.model('CrateItem', crateItemSchema);