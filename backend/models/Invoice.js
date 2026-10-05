import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const InvoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn_sac: { type: String },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 18 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 }
}, { _id: true });

const InvoiceSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoice_number: { type: String, unique: true, required: true, trim: true },
  issue_date: { type: Date, default: Date.now },
  due_date: { type: Date, required: true },
  subtotal: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  payment_status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
    default: 'SENT'
  },
  notes: { type: String },
  terms_conditions: { type: String },
  items: [InvoiceItemSchema]
}, baseSchemaOptions);

InvoiceSchema.index({ client_id: 1, payment_status: 1 });
InvoiceSchema.index({ due_date: 1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
