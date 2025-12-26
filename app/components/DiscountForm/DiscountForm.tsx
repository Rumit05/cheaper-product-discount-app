import { Spinner } from "@shopify/polaris";
import { returnToDiscounts } from "app/utils/navigation";
import { useCallback, useMemo, useState } from "react";
import { Form } from "react-router";

import { useDiscountForm } from "../../hooks/useDiscountForm";
import { DiscountClass } from "../../types/admin.types";
import { DiscountMethod } from "../../types/types";
import { CollectionPicker } from "../CollectionPicker/CollectionPicker";
import { DatePickerField } from "../DatePickerField/DatePickerField";

interface SubmitError {
    message: string;
    field: string[];
}

interface DiscountFormProps {
    initialData?: {
        title: string;
        method: DiscountMethod;
        code: string;
        combinesWith: {
            orderDiscounts: boolean;
            productDiscounts: boolean;
            shippingDiscounts: boolean;
        };
        discountClasses: DiscountClass[];
        usageLimit: number | null;
        appliesOncePerCustomer: boolean;
        startsAt: string | Date;
        endsAt: string | Date | null;
        configuration: {
            cartLinePercentage: string;
            orderPercentage: string;
            deliveryPercentage: string;
            metafieldId?: string;
            collectionIds?: string[];
            collections?: any[]; // For caching selected collection objects
            // These might be strings or numbers based on backend, but form uses strings often
            applyToCheapestLineOnly: boolean;
            minimumQuantity: string;
            quantityToDiscount: string;
            bulkPrefix?: string;
            bulkQuantity?: string;
        };
    };
    collections: { id: string; title: string }[];
    isEditing?: boolean;
    submitErrors?: SubmitError[];
    isLoading?: boolean;
    success?: boolean;
}

const methodOptions = [
    { label: "Discount code", value: DiscountMethod.Code },
    { label: "Generate bulk discount codes", value: DiscountMethod.Bulk },
    { label: "Automatic discount", value: DiscountMethod.Automatic },
];

export function DiscountForm({
    initialData,
    collections: initialCollections,
    isEditing = false,
    submitErrors = [],
    success = false,
    isLoading = false,
}: DiscountFormProps) {
    const { formState, setField, setConfigField, setCombinesWith, submit } =
        useDiscountForm({
            initialData,
        });

    const [collections, setCollections] =
        useState<DiscountFormProps["collections"]>(initialCollections);

    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);

    const errorBanner = useMemo(
        () =>
            submitErrors.length > 0 ? (
                <s-banner tone="critical">
                    <p>There were some issues with your form submission:</p>
                    <ul>
                        {submitErrors.map(({ message, field }, index) => (
                            <li key={index}>
                                {field.join(".")} {message}
                            </li>
                        ))}
                    </ul>
                </s-banner>
            ) : null,
        [submitErrors],
    );

    const successBanner = useMemo(
        () =>
            success ? (
                <s-banner tone="success">
                    <p>
                        {formState.method === DiscountMethod.Bulk
                            ? "All the coupon codes are generated successfully"
                            : "Discount saved successfully"}
                    </p>
                </s-banner>
            ) : null,
        [success, formState.method],
    );

    const handleCollectionSelect = useCallback(
        async (selectedCollections: { id: string; title: string }[]) => {
            setConfigField(
                "collectionIds",
                selectedCollections.map((collection) => collection.id),
            );
            setCollections(selectedCollections);
        },
        [setConfigField],
    );

    const handleDiscountClassChange = useCallback(
        (discountClassValue: DiscountClass, checked: boolean) => {
            setField(
                "discountClasses",
                checked
                    ? [...formState.discountClasses, discountClassValue]
                    : formState.discountClasses.filter(
                        (discountClass) => discountClass !== discountClassValue,
                    ),
            );
        },
        [formState.discountClasses, setField],
    );

    const handleEndDateCheckboxChange = useCallback(
        (checked: boolean) => {
            if (!checked) {
                setField("endDate", null);
            } else if (!formState.endDate) {
                const tomorrow = new Date(formState.startDate || today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setField("endDate", tomorrow);
            }
        },
        [formState.startDate, formState.endDate, today, setField],
    );

    const handleDateChange = useCallback(
        (date: Date | [Date, Date]) => {
            if (Array.isArray(date)) {
                // Range mode
                setField("startDate", date[0]);
                setField("endDate", date[1]);
            } else {
                // Single mode
                setField("startDate", date);
                if (formState.endDate) {
                    setField("endDate", null);
                }
            }
        },
        [setField, formState.endDate],
    );

    const getDatePickerValue = useCallback(():
        | Date
        | string
        | null
        | [Date | string | null, Date | string | null] => {
        if (formState.endDate) {
            return [formState.startDate, formState.endDate];
        }
        return formState.startDate;
    }, [formState.startDate, formState.endDate]);

    const handleReset = useCallback(() => {
        returnToDiscounts();
    }, []);


    // Removed old Coupon Generator Logic


    return (
        <div style={{ position: "relative" }}>
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        zIndex: 1000,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                    }}
                >
                    <div style={{ marginBottom: "1rem" }}>
                         <Spinner size="large" />
                    </div>
                </div>
            )}
            <Form
                method="post"
                id="discount-form"
                data-save-bar
                onSubmit={(event) => { submit(event.currentTarget); }}
                onReset={handleReset}
            >
                <input
                    type="hidden"
                    name="discount"
                    value={JSON.stringify({
                        title: formState.title,
                        method: formState.method,
                        code: formState.code,
                        // Pass bulk fields
                        configuration: {
                            ...formState.configuration,
                            bulkPrefix: formState.bulkPrefix,
                            bulkQuantity: formState.bulkQuantity,
                        },
                        combinesWith: formState.combinesWith,
                        discountClasses: formState.discountClasses,
                        usageLimit:
                            formState.usageLimit === ""
                                ? null
                                : parseInt(formState.usageLimit, 10),
                        appliesOncePerCustomer: formState.appliesOncePerCustomer,
                        startsAt: formState.startDate,
                        endsAt: formState.endDate,
                        internalConfiguration: {
                            ...(formState.configuration.metafieldId
                                ? { metafieldId: formState.configuration.metafieldId }
                                : {}),
                            cartLinePercentage: parseFloat(
                                formState.configuration.cartLinePercentage,
                            ),
                            orderPercentage: parseFloat(
                                formState.configuration.orderPercentage,
                            ),
                            deliveryPercentage: parseFloat(
                                formState.configuration.deliveryPercentage,
                            ),
                            collectionIds: formState.configuration.collectionIds || [],
                            applyToCheapestLineOnly:
                                formState.configuration.applyToCheapestLineOnly,
                            minimumQuantity: parseInt(
                                formState.configuration.minimumQuantity || "0",
                                10,
                            ),
                            quantityToDiscount: parseInt(
                                formState.configuration.quantityToDiscount || "0",
                                10,
                            ),
                        },
                    })}
                />
                <s-stack gap="base">
                    {errorBanner}
                    {successBanner}

                    <s-stack gap="base">
                        {/* Method section */}
                        <s-section heading={isEditing ? "Edit discount" : "Create discount"}>
                            <s-select
                                label="Discount type"
                                value={formState.method}
                                onChange={(e: any) =>
                                    setField("method", e.target.value as DiscountMethod)
                                }
                                disabled={isEditing}
                            >
                                {methodOptions.map((option) => (
                                    <s-option key={option.value} value={option.value}>
                                        {option.label}
                                    </s-option>
                                ))}
                            </s-select>

                            {formState.method === DiscountMethod.Automatic ? (
                                <s-text-field
                                    label="Discount title"
                                    autocomplete="off"
                                    value={formState.title}
                                    onChange={(e: any) => setField("title", e.target.value)}
                                />
                            ) : formState.method === DiscountMethod.Bulk ? (
                                <s-stack gap="base">
                                    <s-text-field
                                        label="Discount Prefix"
                                        autocomplete="off"
                                        value={formState.bulkPrefix ?? ""}
                                        onChange={(e: any) => setField("bulkPrefix", e.target.value)}
                                    />
                                    <s-number-field
                                        label="Number of coupons"
                                        autocomplete="off"
                                        value={formState.bulkQuantity ?? "5"}
                                        onChange={(e: any) => setField("bulkQuantity", e.target.value)}
                                        min={1}
                                    />
                                </s-stack>
                            ) : (
                                <s-text-field
                                    label="Discount code"
                                    autocomplete="off"
                                    value={formState.code}
                                    onChange={(e: any) => setField("code", e.target.value)}
                                />
                            )}
                        </s-section>

                        {/* Discount classes section */}



                        <s-section heading="Discount Configuration">
                            <s-stack gap="base">
                                    <>
                                        <s-number-field
                                            label="Product discount percentage"
                                            autocomplete="on"
                                            min={0}
                                            max={100}
                                            suffix="%"
                                            value={formState.configuration.cartLinePercentage}
                                            onChange={(e: any) =>
                                                setConfigField("cartLinePercentage", e.target.value)
                                            }
                                        />


                                        <s-number-field
                                            label="Minimum quantity required"
                                            min={0}
                                            value={formState.configuration.minimumQuantity}
                                            onChange={(e: any) =>
                                                setConfigField("minimumQuantity", e.target.value)
                                            }
                                        />
                                        <s-number-field
                                            label="Quantity to discount (free items)"
                                            min={0}
                                            value={formState.configuration.quantityToDiscount}
                                            onChange={(e: any) =>
                                                setConfigField("quantityToDiscount", e.target.value)
                                            }
                                        />
                                        <p style={{ fontSize: "var(--p-font-size-75)", color: "var(--p-color-text-secondary)" }}>
                                            Set to 0 to discount all eligible items.
                                        </p>
                                    </>
                            </s-stack>
                        </s-section>

                        {/* Usage limits section */}
                        {formState.method === DiscountMethod.Code || formState.method === DiscountMethod.Bulk ? (
                            <s-section heading="Usage limits">
                                <s-number-field
                                    label="Usage limit"
                                    autocomplete="on"
                                    min={0}
                                    placeholder="No limit"
                                    value={formState.usageLimit}
                                    onChange={(e: any) => setField("usageLimit", e.target.value)}
                                />
                                <s-checkbox
                                    label="Limit to one use per customer"
                                    checked={formState.appliesOncePerCustomer}
                                    onChange={(e: any) =>
                                        setField("appliesOncePerCustomer", e.target.checked)
                                    }
                                />
                            </s-section>
                        ) : null}

                        {/* Combination section */}



                        {/* Active dates section */}
                        <s-section heading="Active dates">
                            <s-stack gap="base">
                                <DatePickerField
                                    label={formState.endDate ? "Date range" : "Start date"}
                                    type={formState.endDate ? "range" : "single"}
                                    value={getDatePickerValue()}
                                    onChange={handleDateChange}
                                    minDate={today}
                                />

                                <s-checkbox
                                    label="Set end date"
                                    checked={!!formState.endDate}
                                    onChange={(e: any) =>
                                        handleEndDateCheckboxChange(e.target.checked)
                                    }
                                />
                            </s-stack>
                        </s-section>
                    </s-stack>
                </s-stack>
            </Form>
        </div>
    );
}
