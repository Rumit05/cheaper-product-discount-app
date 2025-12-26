import { DatePicker, Icon, Popover, TextField, BlockStack } from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { useState, useEffect, useRef } from "react";

interface DatePickerFieldProps {
    label: string;
    type?: "single" | "range";
    value: Date | [Date, Date] | null | any;
    onChange: (date: Date | [Date, Date]) => void;
    minDate?: Date;
}

export function DatePickerField({
    label,
    type = "single",
    value,
    onChange,
    minDate,
}: DatePickerFieldProps) {
    const [visible, setVisible] = useState(false);
    const [inputDate, setInputDate] = useState("");

    // Helper to format date for display
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    useEffect(() => {
        if (value) {
            if (Array.isArray(value)) {
                // Range
                setInputDate(`${formatDate(value[0])} - ${formatDate(value[1])}`);
            } else if (value instanceof Date) {
                setInputDate(formatDate(value));
            }
        } else {
            setInputDate("");
        }
    }, [value]);

    const handleDateSelection = ({ start, end }: { start: Date; end: Date }) => {
        if (type === "single") {
            onChange(start);
            setVisible(false);
        } else {
            onChange([start, end]);
            // Don't auto close for range often
        }
    };

    const node = useRef(null);

    return (
        <BlockStack gap="200">
            <Popover
                active={visible}
                autofocusTarget="none"
                preferredAlignment="left"
                fullWidth
                preferInputActivator={false}
                preferredPosition="below"
                preventCloseOnChildOverlayClick
                onClose={() => setVisible(false)}
                activator={
                    <TextField
                        role="combobox"
                        label={label}
                        prefix={<Icon source={CalendarIcon} />}
                        value={inputDate}
                        onFocus={() => setVisible(true)}
                        onChange={() => { }} // ReadOnly mostly
                        autoComplete="off"
                    />
                }
            >
                <div style={{ padding: '16px' }}>
                    <DatePicker
                        month={new Date().getMonth()}
                        year={new Date().getFullYear()}
                        onChange={handleDateSelection}
                        onMonthChange={() => { }}
                        selected={
                            type === 'single' && value instanceof Date
                                ? value
                                : Array.isArray(value)
                                    ? { start: value[0], end: value[1] }
                                    : new Date()
                        }
                        allowRange={type === 'range'}
                        disableDatesBefore={minDate}
                    />
                </div>
            </Popover>
        </BlockStack>
    );
}
