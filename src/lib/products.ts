export interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
  wa_number: string;
  created_at: string;
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
