export type DeviceView = "desktop" | "ipad" | "phone";
export type ViewportSize = { width: number; height: number };

export function deviceDimensions(view: DeviceView, rotated: boolean, available: ViewportSize): ViewportSize {
  if (view === "desktop") return { width: Math.max(1, available.width), height: Math.max(1, available.height) };
  const size = view === "ipad" ? { width: 820, height: 1180 } : { width: 390, height: 844 };
  return rotated ? { width: size.height, height: size.width } : size;
}

export function fitDevice(device: ViewportSize, available: ViewportSize): number {
  if (available.width <= 0 || available.height <= 0) return 1;
  return Math.min(1, available.width / device.width, available.height / device.height);
}
