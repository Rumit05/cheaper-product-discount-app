export function returnToDiscounts() {
  if (typeof window !== "undefined" && (window as any).shopify?.redirect) {
    (window as any).shopify.redirect.to("shopify://admin/discounts");
  } else if (typeof window !== "undefined") {
     // Fallback if window.shopify is not available (e.g. testing or older environment)
     // standard window.open might be blocked or behave differently, but it's the standard fallback
     window.open("shopify://admin/discounts", "_top");
  }
}
