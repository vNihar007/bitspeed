import mongoose, { Document, Schema } from 'mongoose';

export type LinkPrecedence = 'primary' | 'secondary';

export interface ContactDocument extends Document {
  phoneNumber?: string;
  email?: string;
  linkedId?: mongoose.Types.ObjectId;
  linkPrecedence: LinkPrecedence;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const ContactSchema = new mongoose.Schema<ContactDocument>({
  phoneNumber: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  linkedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    default: null
  },
  linkPrecedence: {
    type: String,
    enum: ['primary', 'secondary'],
    default: 'primary'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },
});

// Add virtual id field
ContactSchema.virtual('id').get(function (this: ContactDocument) {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});

ContactSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  }
});

export const Contact = mongoose.model<ContactDocument>('Contact', ContactSchema);
