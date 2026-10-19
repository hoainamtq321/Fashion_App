export const ORDER_STATUS_CATALOG = [
  { value: "Pending", label: "Pending", className: "pending" },
  { value: "Processing", label: "Processing", className: "processing" },
  { value: "Shipped", label: "Shipped", className: "shipped" },
  { value: "Delivered", label: "Delivered", className: "delivered" },
  { value: "Cancelled", label: "Cancelled", className: "cancelled" },
];

export const ORDER_STATUS_TRANSITIONS = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export const getOrderStatusClass = (status) =>
  ORDER_STATUS_CATALOG.find(({ value }) => value === status)?.className
  || String(status || "").toLowerCase().replace(" ", "-");
