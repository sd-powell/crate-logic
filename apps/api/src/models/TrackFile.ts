import mongoose from 'mongoose';

const trackFileSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true, unique: true },

    title: { type: String, trim: true },
    artist: { type: String, trim: true },

    bpm: { type: Number },
    key: { type: String, trim: true },

    source: { type: String, default: 'mixedinkey' }, // where bpm/key came from
    yearFolder: { type: String, trim: true },        // derived from folder structure
    genreFolder: { type: String, trim: true }        // derived from folder structure
  },
  { timestamps: true }
);

export const TrackFileModel =
  mongoose.models.TrackFile ?? mongoose.model('TrackFile', trackFileSchema);