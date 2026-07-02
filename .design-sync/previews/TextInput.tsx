import { TextInput } from "singha-roy-enterprise";

const box: React.CSSProperties = { maxWidth: 340, padding: 8, display: "flex", flexDirection: "column", gap: 10 };

export const Default = () => (
    <div style={box}>
        <TextInput placeholder="Customer / firm name" defaultValue="Debarishi Traders" />
    </div>
);

export const Monospace = () => (
    <div style={box}>
        <TextInput mono placeholder="15-character GSTIN" defaultValue="19ALAPR8029B1Z5" />
    </div>
);

export const Invalid = () => (
    <div style={box}>
        <TextInput invalid placeholder="SRE/2026-27/0000" defaultValue="" />
    </div>
);
