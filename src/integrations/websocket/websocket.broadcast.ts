/**
 * Broadcast helper.
 * Tries to emit through the WebSocketService singleton if available.
 * Never throws — safe to call from any route handler.
 */
let wsInstance: any = null;

export function registerWebSocket(instance: any) {
  wsInstance = instance;
}

export function emitToRoom(room: string, event: string, payload: any) {
  try {
    if (wsInstance?.io) {
      wsInstance.io.to(room).emit(event, payload);
      return true;
    }
  } catch (e) {
    console.warn("[ws.broadcast] failed:", e);
  }
  return false;
}

export function emitOrderUpdate(order: any) {
  const payload = {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    updatedAt: order.updatedAt || new Date(),
  };
  emitToRoom(`order:${order._id}`, "order:status", payload);
  emitToRoom(`user:${order.userId}`, "order:status", payload);
  emitToRoom(`retailer:${order.retailerId}`, "order:status", payload);
}

export function emitJobOffer(partnerId: string, assignment: any) {
  emitToRoom(`partner:${partnerId}`, "job:new", {
    assignmentId: String(assignment._id),
    orderId: String(assignment.orderId),
    status: assignment.status,
    offeredAt: assignment.offeredAt,
  });
}
