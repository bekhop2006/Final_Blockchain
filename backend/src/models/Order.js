import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalEth: { type: Number, required: true },
    campaignId: { type: Number, default: null },
    txHash: { type: String, trim: true, default: "" },
    deliveryDueAt: { type: Date, default: null },
    courierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["pending", "picked_up", "on_the_way", "delivered", "cancelled"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

orderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
