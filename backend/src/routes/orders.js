import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = Router();
const DEFAULT_DELIVERY_MINUTES = 30;

// GET /api/orders — мои заказы с курьером и минутами до доставки
router.get("/", authMiddleware, async (req, res) => {
  try {
    const list = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("courierId", "fullName carInfo carPlate")
      .lean();
    const now = Date.now();
    const orders = list.map((o) => {
      let minutesLeft = null;
      if (o.deliveryDueAt) {
        const due = new Date(o.deliveryDueAt).getTime();
        minutesLeft = Math.max(0, Math.ceil((due - now) / 60000));
      }
      const courier = o.courierId
        ? {
            fullName: o.courierId.fullName || "Курьер",
            carInfo: o.courierId.carInfo || "",
            carPlate: o.courierId.carPlate || "",
          }
        : null;
      return {
        id: o._id,
        items: o.items,
        totalEth: o.totalEth,
        campaignId: o.campaignId,
        txHash: o.txHash,
        createdAt: o.createdAt,
        deliveryDueAt: o.deliveryDueAt,
        minutesLeft,
        courier,
        status: o.status || "pending",
      };
    });
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch orders" });
  }
});

// POST /api/orders — создать заказ (после успешной оплаты), назначить курьера если есть
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, totalEth, campaignId, txHash } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items required" });
    }
    if (typeof totalEth !== "number" || totalEth < 0) {
      return res.status(400).json({ error: "Valid totalEth required" });
    }
    const deliveryDueAt = new Date(Date.now() + DEFAULT_DELIVERY_MINUTES * 60 * 1000);
    const order = await Order.create({
      userId: req.userId,
      items: items.map(({ productId, quantity }) => ({
        productId: String(productId),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
      })),
      totalEth,
      campaignId: campaignId != null ? Number(campaignId) : null,
      txHash: (txHash || "").trim() || undefined,
      deliveryDueAt,
      courierId: null,
    });
    res.status(201).json({
      order: {
        id: order._id,
        items: order.items,
        totalEth: order.totalEth,
        campaignId: order.campaignId,
        txHash: order.txHash,
        createdAt: order.createdAt,
        deliveryDueAt: order.deliveryDueAt,
        courierId: order.courierId,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create order" });
  }
});

// Проверка: текущий пользователь — курьер
async function requireCourier(req, res, next) {
  const user = await User.findById(req.userId).select("role").lean();
  if (!user || user.role !== "courier") {
    return res.status(403).json({ error: "Только для курьеров" });
  }
  next();
}

// GET /api/orders/deliveries — заказы, назначенные мне (курьеру), без отменённых
router.get("/deliveries", authMiddleware, requireCourier, async (req, res) => {
  try {
    const list = await Order.find({ courierId: req.userId, status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName phone address")
      .lean();
    const now = Date.now();
    const orders = list.map((o) => {
      let minutesLeft = null;
      if (o.deliveryDueAt) {
        const due = new Date(o.deliveryDueAt).getTime();
        minutesLeft = Math.max(0, Math.ceil((due - now) / 60000));
      }
      const customer = o.userId
        ? { fullName: o.userId.fullName || "", phone: o.userId.phone || "", address: o.userId.address || "" }
        : null;
      return {
        id: o._id,
        items: o.items,
        totalEth: o.totalEth,
        createdAt: o.createdAt,
        deliveryDueAt: o.deliveryDueAt,
        minutesLeft,
        customer,
        status: o.status || "pending",
      };
    });
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch deliveries" });
  }
});

// GET /api/orders/available — заказы без курьера и не отменённые (курьер может взять)
router.get("/available", authMiddleware, requireCourier, async (req, res) => {
  try {
    const list = await Order.find({ courierId: null, status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName phone address")
      .lean();
    const now = Date.now();
    const orders = list.map((o) => {
      let minutesLeft = null;
      if (o.deliveryDueAt) {
        const due = new Date(o.deliveryDueAt).getTime();
        minutesLeft = Math.max(0, Math.ceil((due - now) / 60000));
      }
      const customer = o.userId
        ? { fullName: o.userId.fullName || "", phone: o.userId.phone || "", address: o.userId.address || "" }
        : null;
      return {
        id: o._id,
        items: o.items,
        totalEth: o.totalEth,
        createdAt: o.createdAt,
        deliveryDueAt: o.deliveryDueAt,
        minutesLeft,
        customer,
      };
    });
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch available orders" });
  }
});

// PATCH /api/orders/:id/assign — взять заказ (назначить себя курьером)
router.patch("/:id/assign", authMiddleware, requireCourier, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Заказ не найден" });
    if (order.courierId) return res.status(400).json({ error: "Заказ уже назначен другому курьеру" });
    order.courierId = req.userId;
    await order.save();
    res.json({ ok: true, orderId: order._id });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to assign order" });
  }
});

const STATUS_FLOW = { pending: "picked_up", picked_up: "on_the_way", on_the_way: "delivered" };

// PATCH /api/orders/:id/status — курьер меняет статус: picked_up | on_the_way | delivered
router.patch("/:id/status", authMiddleware, requireCourier, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["picked_up", "on_the_way", "delivered"].includes(status)) {
      return res.status(400).json({ error: "Недопустимый статус" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Заказ не найден" });
    if (String(order.courierId) !== String(req.userId)) {
      return res.status(403).json({ error: "Не ваш заказ" });
    }
    const current = order.status || "pending";
    if (STATUS_FLOW[current] !== status) {
      return res.status(400).json({ error: `Сначала: ${current} → ${STATUS_FLOW[current]}` });
    }
    order.status = status;
    await order.save();
    res.json({ ok: true, status: order.status });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update status" });
  }
});

// PATCH /api/orders/:id/delivery-time — курьер меняет время доставки (минут от сейчас)
router.patch("/:id/delivery-time", authMiddleware, requireCourier, async (req, res) => {
  try {
    const { minutesFromNow } = req.body;
    const minutes = parseInt(minutesFromNow, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      return res.status(400).json({ error: "Укажите минуты от 1 до 180" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Заказ не найден" });
    if (String(order.courierId) !== String(req.userId)) {
      return res.status(403).json({ error: "Не ваш заказ" });
    }
    if (order.status === "cancelled") return res.status(400).json({ error: "Заказ отменён" });
    order.deliveryDueAt = new Date(Date.now() + minutes * 60 * 1000);
    await order.save();
    res.json({ ok: true, deliveryDueAt: order.deliveryDueAt });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update delivery time" });
  }
});

// PATCH /api/orders/:id/cancel — клиент отменяет свой заказ
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Заказ не найден" });
    if (String(order.userId) !== String(req.userId)) {
      return res.status(403).json({ error: "Не ваш заказ" });
    }
    if (order.status === "delivered") {
      return res.status(400).json({ error: "Доставленный заказ отменить нельзя" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Заказ уже отменён" });
    }
    order.status = "cancelled";
    await order.save();
    res.json({ ok: true, status: "cancelled" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to cancel order" });
  }
});

export default router;
