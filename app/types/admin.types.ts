export enum DiscountClass {
  Product = "PRODUCT",
  Order = "ORDER",
  Shipping = "SHIPPING",
}

export interface Collection {
  id: string;
  title: string;
}
