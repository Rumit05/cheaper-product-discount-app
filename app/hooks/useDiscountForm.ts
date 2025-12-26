import { useState, useCallback } from "react";
import { useSubmit, useActionData, useNavigation } from "react-router";
import { DiscountMethod } from "../types/types";
import { DiscountClass } from "../types/admin.types";

// Assuming these types based on usage in DiscountForm
export interface DiscountFormState {
  title: string;
  method: DiscountMethod;
  code: string;
  // properties for bulk discount
  bulkPrefix?: string;
  bulkQuantity?: string;
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  discountClasses: string[]; // Using string[] for now, or match enum
  usageLimit: string; // Form inputs are usually strings
  appliesOncePerCustomer: boolean;
  startDate: Date;
  endDate: Date | null;
  configuration: {
    cartLinePercentage: string;
    orderPercentage: string;
    deliveryPercentage: string;
    metafieldId?: string;
    collectionIds?: string[];
    collections?: any[]; // For caching selected collection objects
    applyToCheapestLineOnly: boolean;
    minimumQuantity: string;
    quantityToDiscount: string;
  };
}

interface UseDiscountFormOptions {
  initialData?: any;
}

export function useDiscountForm({ initialData }: UseDiscountFormOptions = {}) {
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();

  const [formState, setFormState] = useState<DiscountFormState>(() => {
    if (initialData) {
      return {
        ...initialData,
        usageLimit: initialData.usageLimit?.toString() ?? "",
        // Ensure mapping is correct
        discountClasses: [DiscountClass.Product],
        startDate: new Date(initialData.startsAt),
        endDate: initialData.endsAt ? new Date(initialData.endsAt) : null,
        configuration: {
          ...initialData.configuration,
          // Ensure it falls back to false if undefined, though initialData should likely have it
          applyToCheapestLineOnly:
            initialData.configuration?.applyToCheapestLineOnly ?? false,
          minimumQuantity: initialData.configuration?.minimumQuantity?.toString() ?? "0",
          quantityToDiscount: initialData.configuration?.quantityToDiscount?.toString() ?? "0",
        },
      };
    }
    return {
      title: "",
      method: DiscountMethod.Code,
      code: "",
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
      discountClasses: [DiscountClass.Product],
      usageLimit: "",
      appliesOncePerCustomer: false,
      startDate: new Date(),
      endDate: null,
      configuration: {
        cartLinePercentage: "0",
        orderPercentage: "0",
        deliveryPercentage: "0",
        collectionIds: [],
        applyToCheapestLineOnly: false,
        minimumQuantity: "0",
        quantityToDiscount: "0",
      },
    };
  });

  const setField = useCallback((field: keyof DiscountFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setConfigField = useCallback(
    (field: keyof DiscountFormState["configuration"], value: any) => {
      setFormState((prev) => ({
        ...prev,
        configuration: { ...prev.configuration, [field]: value },
      }));
    },
    []
  );

  const setCombinesWith = useCallback((field: string, value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      combinesWith: { ...prev.combinesWith, [field]: value },
    }));
  }, []);

  return {
    formState,
    setField,
    setConfigField,
    setCombinesWith,
    submit,
    actionData,
    isSubmitting: navigation.state === "submitting",
  };
}
