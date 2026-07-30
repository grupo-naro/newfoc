/**
 * Repositorio de órdenes — única capa que habla con Prisma.
 */
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/lib/db";
import { tryIncrementUsage } from "@/core/modules/coupons/coupons.repository";

import type { OrderStatus } from "./orders.status";
import type {
  CreateOrderShippingInput,
  DashboardStats,
  Order,
  OrderCoupon,
  OrderItem,
  OrderSummary,
} from "./orders.types";

const orderInclude = {
  items: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    email: row.email,
    customerName: row.customerName,
    phone: row.phone,
    shipping: {
      method: row.shippingMethod,
      cost: row.shippingCost,
      recipient: row.shippingRecipient,
      street: row.shippingStreet,
      apartment: row.shippingApartment,
      city: row.shippingCity,
      province: row.shippingProvince,
      postalCode: row.shippingPostalCode,
      notes: row.shippingNotes,
    },
    items: row.items.map(
      (item): OrderItem => ({
        id: item.id,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        imagePublicId: item.imagePublicId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }),
    ),
    subtotal: row.subtotal,
    couponDiscount: row.couponDiscount,
    coupon:
      row.couponId && row.couponCode
        ? {
            id: row.couponId,
            code: row.couponCode,
            discount: row.couponDiscount,
          }
        : null,
    total: row.total,
    paymentId: row.paymentId,
    trackingCode: row.trackingCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Datos ya validados y con totales calculados — los arma el use-case. */
export interface CreateOrderData {
  email: string;
  customerName: string;
  phone: string | null;
  shipping: CreateOrderShippingInput;
  subtotal: number;
  total: number;
  /** Snapshot del cupón aplicado (ya validado por el use-case), o null. */
  coupon: OrderCoupon | null;
  items: {
    variantId: string | null;
    productId: string | null;
    productName: string;
    variantName: string | null;
    sku: string | null;
    imagePublicId: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
}

/**
 * Error cuando el cupón se agotó entre la validación previa y el
 * commit final (race condition). El checkout lo traduce a un mensaje
 * visible para el cliente.
 */
export class CouponNoLongerAvailableError extends Error {
  constructor() {
    super("El cupón ya no está disponible.");
    this.name = "CouponNoLongerAvailableError";
  }
}

/**
 * Stock insuficiente al crear la orden. `unavailable` lista las
 * variantes que fallaron — el checkout las traduce a un mensaje útil.
 */
export class InsufficientStockError extends Error {
  unavailable: { variantId: string; requested: number }[];
  constructor(unavailable: { variantId: string; requested: number }[]) {
    super("No hay stock suficiente para uno o más ítems.");
    this.name = "InsufficientStockError";
    this.unavailable = unavailable;
  }
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  // Una sola transacción: descuenta stock atómico por variante (CAS
  // sobre `stock >= quantity`), incrementa el cupón con guard, y crea
  // la orden. Si algo falla, rollback completo.
  const row = await prisma.$transaction(async (tx) => {
    // Descuento atómico de stock. Agrupamos por variantId por si hay
    // dos líneas con la misma variante (no debería pasar pero defensivo).
    const requestedByVariant = new Map<string, number>();
    for (const item of data.items) {
      if (!item.variantId) continue; // ítem sin puntero a variante: skip
      requestedByVariant.set(
        item.variantId,
        (requestedByVariant.get(item.variantId) ?? 0) + item.quantity,
      );
    }
    const unavailable: { variantId: string; requested: number }[] = [];
    for (const [variantId, quantity] of requestedByVariant) {
      const result = await tx.productVariant.updateMany({
        where: { id: variantId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (result.count === 0) {
        unavailable.push({ variantId, requested: quantity });
      }
    }
    if (unavailable.length > 0) {
      throw new InsufficientStockError(unavailable);
    }

    if (data.coupon) {
      const ok = await tryIncrementUsage(tx, data.coupon.id);
      if (!ok) throw new CouponNoLongerAvailableError();
    }
    return tx.order.create({
      data: {
        email: data.email,
        customerName: data.customerName,
        phone: data.phone,
        shippingMethod: data.shipping.method,
        shippingCost: data.shipping.cost,
        shippingRecipient: data.shipping.recipient ?? null,
        shippingStreet: data.shipping.street ?? null,
        shippingApartment: data.shipping.apartment ?? null,
        shippingCity: data.shipping.city ?? null,
        shippingProvince: data.shipping.province ?? null,
        shippingPostalCode: data.shipping.postalCode ?? null,
        shippingNotes: data.shipping.notes ?? null,
        subtotal: data.subtotal,
        total: data.total,
        couponId: data.coupon?.id ?? null,
        couponCode: data.coupon?.code ?? null,
        couponDiscount: data.coupon?.discount ?? 0,
        items: { create: data.items },
      },
      include: orderInclude,
    });
  });
  return toOrder(row);
}

export async function findOrderById(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

export async function findOrderByNumber(
  orderNumber: number,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

/** Campos editables de una orden desde el panel. */
export interface UpdateOrderData {
  status?: OrderStatus;
  trackingCode?: string | null;
}

/**
 * Actualiza una orden. Si pasa a CANCELLED y todavía no se liberó el
 * stock (`stockReleased = false`), devuelve las unidades al inventario
 * en la misma transacción y marca el flag — idempotente, no devuelve
 * dos veces.
 */
export async function updateOrder(
  id: string,
  data: UpdateOrderData,
): Promise<Order> {
  const row = await prisma.$transaction(async (tx) => {
    const goingToCancelled = data.status === "CANCELLED";
    if (goingToCancelled) {
      const current = await tx.order.findUnique({
        where: { id },
        select: {
          stockReleased: true,
          items: { select: { variantId: true, quantity: true } },
        },
      });
      if (current && !current.stockReleased) {
        // Sumamos por variantId por si hay duplicados de línea.
        const restoreByVariant = new Map<string, number>();
        for (const item of current.items) {
          if (!item.variantId) continue;
          restoreByVariant.set(
            item.variantId,
            (restoreByVariant.get(item.variantId) ?? 0) + item.quantity,
          );
        }
        for (const [variantId, quantity] of restoreByVariant) {
          await tx.productVariant.updateMany({
            where: { id: variantId },
            data: { stock: { increment: quantity } },
          });
        }
      }
    }

    return tx.order.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.trackingCode !== undefined && {
          trackingCode: data.trackingCode,
        }),
        ...(goingToCancelled && { stockReleased: true }),
      },
      include: orderInclude,
    });
  });
  return toOrder(row);
}

// ─── Listado del panel (M4.1) ──────────────────────────────────

export interface OrderListFilters {
  status?: OrderStatus;
  search?: string;
  skip: number;
  take: number;
}

const orderSummarySelect = {
  id: true,
  number: true,
  customerName: true,
  phone: true,
  status: true,
  total: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

/** Arma el `where` del listado/export — estado + búsqueda. */
function buildOrderWhere(
  status?: OrderStatus,
  search?: string,
): Prisma.OrderWhereInput {
  const term = search?.trim();
  const orFilters: Prisma.OrderWhereInput[] = [];
  if (term) {
    orFilters.push(
      { customerName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    );
    if (/^\d+$/.test(term)) orFilters.push({ number: Number(term) });
  }
  return {
    ...(status && { status }),
    ...(orFilters.length > 0 && { OR: orFilters }),
  };
}

/** Órdenes filtradas + total que matchea — los más nuevos primero. */
export async function listOrders(
  filters: OrderListFilters,
): Promise<{ items: OrderSummary[]; total: number }> {
  const where = buildOrderWhere(filters.status, filters.search);

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
      select: orderSummarySelect,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total };
}

/** Fila del export CSV — datos a nivel orden (sin ítems). */
export interface OrderExportRow {
  number: number;
  createdAt: Date;
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string | null;
  shippingMethod: string;
  shippingCost: number;
  /** Dirección compuesta en una línea, o "" si es retiro. */
  shippingAddress: string;
  subtotal: number;
  /** Cupón aplicado — "" si no había. */
  couponCode: string;
  couponDiscount: number;
  total: number;
  trackingCode: string | null;
  paymentId: string | null;
}

/** Órdenes que matchean el filtro, para exportar (sin paginar, tope 10000). */
export async function findOrdersForExport(filters: {
  status?: OrderStatus;
  search?: string;
}): Promise<OrderExportRow[]> {
  const rows = await prisma.order.findMany({
    where: buildOrderWhere(filters.status, filters.search),
    orderBy: { createdAt: "desc" },
    take: 10000,
    select: {
      number: true,
      createdAt: true,
      status: true,
      customerName: true,
      email: true,
      phone: true,
      shippingMethod: true,
      shippingCost: true,
      shippingStreet: true,
      shippingApartment: true,
      shippingCity: true,
      shippingProvince: true,
      shippingPostalCode: true,
      subtotal: true,
      couponCode: true,
      couponDiscount: true,
      total: true,
      trackingCode: true,
      paymentId: true,
    },
  });

  return rows.map((row) => {
    const addressParts = [
      row.shippingStreet,
      row.shippingApartment,
      row.shippingCity,
      row.shippingProvince,
      row.shippingPostalCode,
    ].filter((part): part is string => Boolean(part));
    return {
      number: row.number,
      createdAt: row.createdAt,
      status: row.status,
      customerName: row.customerName,
      email: row.email,
      phone: row.phone,
      shippingMethod: row.shippingMethod,
      shippingCost: row.shippingCost,
      shippingAddress: addressParts.join(", "),
      subtotal: row.subtotal,
      couponCode: row.couponCode ?? "",
      couponDiscount: row.couponDiscount,
      total: row.total,
      trackingCode: row.trackingCode,
      paymentId: row.paymentId,
    };
  });
}

/** Marca una orden como pagada y guarda el id del pago de Mercado Pago. */
export async function markOrderPaid(
  id: string,
  paymentId: string,
): Promise<Order> {
  const row = await prisma.order.update({
    where: { id },
    data: { status: "PAID", paymentId },
    include: orderInclude,
  });
  return toOrder(row);
}

/** Métricas para el dashboard del panel — todas las consultas en paralelo. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalOrders, pendingOrders, paidOrders, revenueAgg, recentRows, topRows] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "PAID" },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: orderSummarySelect,
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  return {
    totalOrders,
    pendingOrders,
    paidOrders,
    revenue: revenueAgg._sum.total ?? 0,
    recentOrders: recentRows.map((row) => ({
      id: row.id,
      number: row.number,
      customerName: row.customerName,
      phone: row.phone,
      status: row.status,
      total: row.total,
      createdAt: row.createdAt,
    })),
    topProducts: topRows.map((row) => ({
      productName: row.productName,
      unitsSold: row._sum.quantity ?? 0,
      revenue: row._sum.lineTotal ?? 0,
    })),
  };
}
