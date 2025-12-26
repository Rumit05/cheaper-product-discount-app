export enum DiscountMethod {
  Code = "Code",
  Automatic = "Automatic",
  Bulk = "Bulk",
}

export interface DiscountData {
  title: string;
  method: DiscountMethod;
  code: string;
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  usageLimit: number | null;
  appliesOncePerCustomer: boolean;
  startsAt: Date;
  endsAt: Date | null;
  configuration: {
    cartLinePercentage: string;
    orderPercentage: string;
    deliveryPercentage: string;
    collectionIds: string[];
    metafieldId?: string;
    applyToCheapestLineOnly: boolean;
    minimumQuantity?: number;
    quantityToDiscount?: number;
  };
  discountClasses: string[];
}
