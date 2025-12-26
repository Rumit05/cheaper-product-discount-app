import {
  type ActionFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import {
  createCodeDiscount,
  createAutomaticDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";
import { returnToDiscounts } from "../utils/navigation";

export const loader = async () => {
  // Initially load with empty collections since none are selected yet
  return { collections: [] };
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string")
    throw new Error("No discount data provided");

  try {
    const {
      title,
      method,
      code,
      combinesWith,
      usageLimit,
      appliesOncePerCustomer,
      startsAt,
      endsAt,
      discountClasses,
      configuration,
    } = JSON.parse(discountData);

    const baseDiscount = {
      functionId,
      title,
      combinesWith: {
        ...combinesWith,
        productDiscounts: true,
      },
      discountClasses,
      startsAt: new Date(startsAt),
      endsAt: endsAt && new Date(endsAt),
    };

    let result;

    if (method === DiscountMethod.Code) {
      result = await createCodeDiscount(
        request,
        baseDiscount,
        code,
        usageLimit,
        appliesOncePerCustomer,
        {
          cartLinePercentage: parseFloat(configuration.cartLinePercentage),
          orderPercentage: parseFloat(configuration.orderPercentage),
          deliveryPercentage: parseFloat(configuration.deliveryPercentage),
          collectionIds: configuration.collectionIds || [],
          applyToCheapestLineOnly: configuration.applyToCheapestLineOnly,
          minimumQuantity: parseFloat(configuration.minimumQuantity),
          quantityToDiscount: parseFloat(configuration.quantityToDiscount),
        },
      );
    } else if (method === DiscountMethod.Bulk) {
        // Handle Bulk creation
        const prefix = configuration.bulkPrefix;
        const quantity = parseInt(configuration.bulkQuantity || "0", 10);
        if (!prefix || quantity <= 0) {
            return { errors: [{ message: "Prefix and valid quantity are required for bulk creation", field: [] }] };
        }

        const errors: any[] = [];
        // Loop to create discounts
        for (let i = 0; i < quantity; i++) {
             const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
             const code = `${prefix}-${randomSuffix}`;
             
             const res = await createCodeDiscount(
                request,
                baseDiscount,
                code,
                usageLimit,
                appliesOncePerCustomer,
                {
                  cartLinePercentage: parseFloat(configuration.cartLinePercentage),
                  orderPercentage: parseFloat(configuration.orderPercentage),
                  deliveryPercentage: parseFloat(configuration.deliveryPercentage),
                  collectionIds: configuration.collectionIds || [],
                  applyToCheapestLineOnly: configuration.applyToCheapestLineOnly,
                  minimumQuantity: parseFloat(configuration.minimumQuantity),
                  quantityToDiscount: parseFloat(configuration.quantityToDiscount),
                },
              );
              if (res.errors) {
                  errors.push(...res.errors);
              }
        }
        
        if (errors.length > 0) {
             return { errors };
        }
        return { success: true };

    } else {
      result = await createAutomaticDiscount(request, baseDiscount, {
        cartLinePercentage: parseFloat(configuration.cartLinePercentage),
        orderPercentage: parseFloat(configuration.orderPercentage),
        deliveryPercentage: parseFloat(configuration.deliveryPercentage),
        collectionIds: configuration.collectionIds || [],
        applyToCheapestLineOnly: configuration.applyToCheapestLineOnly,
        minimumQuantity: parseFloat(configuration.minimumQuantity),
        quantityToDiscount: parseFloat(configuration.quantityToDiscount),
      });
    }

    if (result.errors?.length > 0) {
      return { errors: result.errors };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Discount create failed", e);
    return {
      errors: [
        {
          message: e.message || "An unexpected error occurred",
          field: [],
        },
      ],
    };
  }
};

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  collections: { id: string; title: string }[];
}

export default function VolumeNew() {
  const actionData = useActionData<ActionData>();
  const { collections } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors = actionData?.errors || [];

  if (actionData?.success) {
    returnToDiscounts();
  }

  const initialData = {
    title: "",
    method: DiscountMethod.Code,
    code: "",
    discountClasses: [],
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: null,
    appliesOncePerCustomer: false,
    startsAt: new Date(),
    endsAt: null,
    configuration: {
      cartLinePercentage: "0",
      orderPercentage: "0",
      deliveryPercentage: "0",
      collectionIds: [],
      applyToCheapestLineOnly: true,
      minimumQuantity: "0",
      quantityToDiscount: "0",
    },
  };

  return (
    <s-page>
      <ui-title-bar title="Create Cheaper Product Discount">
        <button type="button" variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        collections={collections}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </s-page>
  );
}
