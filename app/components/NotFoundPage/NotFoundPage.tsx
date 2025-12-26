import { Card, EmptyState, Page } from "@shopify/polaris";


export function NotFoundPage() {
    // Simple fallback translation or string if i18n isn't fully set up yet
    // Using direct strings for robustness in this context
    return (
        <Page>
            <Card>
                <EmptyState
                    heading="Page not found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                    <p>Check the URL and try again, or use the search bar to find what you need.</p>
                </EmptyState>
            </Card>
        </Page>
    );
}
