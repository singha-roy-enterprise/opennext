import { Button } from "singha-roy-enterprise";
import { FiDownload, FiPlus, FiLogIn } from "react-icons/fi";

const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: 8 };

export const Variants = () => (
    <div style={row}>
        <Button variant="primary">Sign in</Button>
        <Button variant="accent">Download Invoice</Button>
        <Button variant="outline">Credit Note</Button>
        <Button variant="ghost">Add row</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="link">Switch account</Button>
    </div>
);

export const WithIcons = () => (
    <div style={row}>
        <Button variant="primary">
            <FiLogIn size={15} /> Sign in
        </Button>
        <Button variant="accent">
            <FiDownload size={16} /> Download Invoice
        </Button>
        <Button variant="ghost" size="sm">
            <FiPlus size={15} /> Add item
        </Button>
    </div>
);

export const Sizes = () => (
    <div style={row}>
        <Button variant="primary" size="sm">
            Small
        </Button>
        <Button variant="primary" size="md">
            Medium
        </Button>
    </div>
);
