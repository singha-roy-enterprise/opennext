import { FieldLabel, TextInput } from "singha-roy-enterprise";

export const Default = () => (
    <div style={{ maxWidth: 320, padding: 8 }}>
        <FieldLabel>Customer Name</FieldLabel>
        <TextInput placeholder="Customer / firm name" />
    </div>
);

export const OnFields = () => (
    <div style={{ maxWidth: 320, padding: 8, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
            <FieldLabel>HSN / SAC</FieldLabel>
            <TextInput mono defaultValue="2523" />
        </div>
        <div>
            <FieldLabel>PIN Code</FieldLabel>
            <TextInput mono defaultValue="733101" />
        </div>
    </div>
);
