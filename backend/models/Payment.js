import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const PaymentSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  payment_number: { type: String, trim: true },
  payment_date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  payment_mode: { type: String, default: 'BANK_TRANSFER' }, // BANK_TRANSFER, UPI, CHEQUE, CASH, CARD, ONLINE
  transaction_reference: { type: String },
  notes: { type: String }
}, baseSchemaOptions);

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
