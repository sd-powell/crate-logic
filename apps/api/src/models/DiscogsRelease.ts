import mongoose from 'mongoose';

const discogsArtistSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    anv: { type: String, trim: true },
    join: { type: String, trim: true }
  },
  { _id: false }
);

const discogsTrackSchema = new mongoose.Schema(
  {
    position: { type: String, trim: true },
    type_: { type: String, trim: true },
    title: { type: String, trim: true },
    duration: { type: String, trim: true },
    durationSeconds: { type: Number },
    artists: { type: [discogsArtistSchema], default: undefined }
  },
  { _id: false }
);

const discogsImageSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    uri: { type: String, trim: true },
    resource_url: { type: String, trim: true },
    uri150: { type: String, trim: true },
    width: { type: Number },
    height: { type: Number }
  },
  { _id: false }
);

const discogsLabelSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    catno: { type: String, trim: true }
  },
  { _id: false }
);

const discogsReleaseSchema = new mongoose.Schema(
  {
    discogsReleaseId: { type: Number, required: true, unique: true, index: true },

    title: { type: String, trim: true },
    year: { type: Number },

    artists: { type: [discogsArtistSchema], default: [] },
    labels: { type: [discogsLabelSchema], default: [] },

    genres: { type: [String], default: [] },
    styles: { type: [String], default: [] },

    country: { type: String, trim: true },
    released: { type: String, trim: true },

    notes: { type: String },
    thumb: { type: String, trim: true },

    tracklist: { type: [discogsTrackSchema], default: [] },
    images: { type: [discogsImageSchema], default: [] },

    raw: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const DiscogsReleaseModel =
  mongoose.models.DiscogsRelease ??
  mongoose.model('DiscogsRelease', discogsReleaseSchema);
