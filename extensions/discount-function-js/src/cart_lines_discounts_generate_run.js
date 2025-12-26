import {
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

export function cartLinesDiscountsGenerateRun(input) {
  console.error("Input:", JSON.stringify(input, null, 2));

  if (!input.cart.lines.length) {
    throw new Error("No cart lines found");
  }

  const {
    cartLinePercentage,
    orderPercentage,
    collectionIds,
    applyToCheapestLineOnly,
    minimumQuantity,
    quantityToDiscount,
  } = parseMetafield(input.discount.metafield);

  console.error("Parsed configuration:", {
    cartLinePercentage,
    orderPercentage,
    collectionIds,
    applyToCheapestLineOnly,
    minimumQuantity,
    quantityToDiscount,
  });

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  console.error("Classes:", {
    hasOrderDiscountClass,
    hasProductDiscountClass,
    classes: input.discount.discountClasses,
  });

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    return { operations: [] };
  }

  const operations = [];
  // Add product discounts first if available and allowed
  // Add product discounts first if available and allowed
  if (hasProductDiscountClass && cartLinePercentage > 0) {
    // 1. Identify all eligible lines (product exists + in collection)
    const eligibleLines = input.cart.lines.filter((line) => {
      const isProduct = "product" in line.merchandise;
      const inAnyCollection = line.merchandise.product?.inAnyCollection;
      return isProduct && (inAnyCollection || collectionIds.length === 0);
    }).map(line => ({
      cartLine: line,
      quantity: line.quantity,
      cost: parseFloat(
        line.cost.amountPerQuantity?.amount ||
        line.cost.subtotalAmount.amount
      )
    }));

    // 2. Calculate Total Eligible Quantity
    const totalEligibleQuantity = eligibleLines.reduce((sum, line) => sum + line.quantity, 0);

    console.error(`Total Eligible Quantity: ${totalEligibleQuantity}. Required: ${minimumQuantity}`);

    // 3. Check Minimum Quantity (Global check)
    if (minimumQuantity > 0 && totalEligibleQuantity < minimumQuantity) {
      console.error("Minimum quantity not met");
      return { operations: [] };
    }

    if (eligibleLines.length > 0) {
      let targetsToDiscount = [];

      if (quantityToDiscount > 0) {
        // "Free N Items" / "Cheapest N Items" logic
        
        // Sort by cost ASCENDING (Cheapest first)
        // We want to apply the discount to the cheapest items first.
        eligibleLines.sort((a, b) => a.cost - b.cost);

        let remainingToDiscount = quantityToDiscount;
        let candidates = [];

        for (const line of eligibleLines) {
          if (remainingToDiscount <= 0) break;

          const qtyToApply = Math.min(line.quantity, remainingToDiscount);
          
          // Calculate discount amount: UnitPrice * QtyToApply * (Percentage / 100)
          const amountToDiscount = line.cost * qtyToApply * (cartLinePercentage / 100);

          candidates.push({
            cartLine: line.cartLine,
            amount: amountToDiscount
          });

          remainingToDiscount -= qtyToApply;
        }

        // Create operations for these candidates
        const discountCandidates = candidates.map(c => ({
            message: `${cartLinePercentage}% OFF CHEAPEST`,
            targets: [{ cartLine: { id: c.cartLine.id } }],
            value: {
              fixedAmount: {
                amount: c.amount.toFixed(2),
              }
            }
        }));

        if (discountCandidates.length > 0) {
           operations.push({
            productDiscountsAdd: {
              candidates: discountCandidates,
              selectionStrategy: ProductDiscountSelectionStrategy.First,
            },
          });
        }

      } else {
        // Standard Behavior: Apply to ALL eligible items if quantityToDiscount is 0
        // But what if applyToCheapestLineOnly is TRUE?
        // The previous logic for "applyToCheapestLineOnly" was "Keep only the cheapest LINE".
        // If applyToCheapestLineOnly is true AND quantityToDiscount is 0 (unlimited),
        // it probably implies "Apply to the ONE cheapest line (all quantities)".
        
        let finalTargets = eligibleLines;

        if (applyToCheapestLineOnly) {
           finalTargets.sort((a, b) => a.cost - b.cost);
           finalTargets = [finalTargets[0]];
        }
        
         operations.push({
          productDiscountsAdd: {
            candidates: [
              {
                message: `${cartLinePercentage}% OFF`,
                targets: finalTargets.map(t => ({ cartLine: { id: t.cartLine.id } })),
                value: {
                  percentage: {
                    value: cartLinePercentage,
                  },
                },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        });
      }
    }
  }

  // Then add order discounts if available and allowed
  if (hasOrderDiscountClass && orderPercentage > 0) {
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: `${orderPercentage}% OFF ORDER`,
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: orderPercentage,
              },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
  }

  console.error("Operations:", JSON.stringify(operations, null, 2));
  return { operations };
}

function parseMetafield(metafield) {
  try {
    const value = JSON.parse(metafield.value);
    return {
      cartLinePercentage: parseFloat(value.cartLinePercentage) || 0,
      orderPercentage: parseFloat(value.orderPercentage) || 0,
      collectionIds: value.collectionIds || [],
      applyToCheapestLineOnly: value.applyToCheapestLineOnly || false,
      minimumQuantity: parseFloat(value.minimumQuantity) || 0,
      quantityToDiscount: parseFloat(value.quantityToDiscount) || 0,
    };
  } catch (error) {
    console.error("Error parsing metafield", error);
    return {
      cartLinePercentage: 0,
      orderPercentage: 0,
      collectionIds: [],
      applyToCheapestLineOnly: false,
      minimumQuantity: 0,
      quantityToDiscount: 0,
    };
  }
}
