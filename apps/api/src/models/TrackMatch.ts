import mongoose from 'mongoose';

const trackMatchSchema = new mongoose.Schema(
  {
    trackFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrackFile',
      required: true,
      index: true
    },

    discogsReleaseId: {
      type: Number,
      required: true,
      index: true
    },

    discogsTrackPosition: { type: String, trim: true },
    discogsTrackTitle: { type: String, trim: true },

    confidence: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ['suggested', 'confirmed', 'rejected'],
      default: 'suggested',
      index: true
    },

    matchType: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

trackMatchSchema.index(
  { trackFileId: 1, discogsReleaseId: 1, discogsTrackPosition: 1 },
  { unique: true }
);

export const TrackMatchModel =
  mongoose.models.TrackMatch ??
  mongoose.model('TrackMatch', trackMatchSchema);