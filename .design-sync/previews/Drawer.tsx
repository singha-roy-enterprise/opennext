import { Drawer, Button, TextInput, FieldLabel } from "singha-roy-enterprise";

const noop = () => {};
const col: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

export const AddItem = () => (
    <Drawer
        onClose={noop}
        title="Add new item"
        footer={
            <>
                <Button variant="outline" className="flex-1 p-3">
                    Cancel
                </Button>
                <Button variant="accent" className="flex-[2] p-3">
                    Add item
                </Button>
            </>
        }
    >
        <div style={col}>
            <div>
                <FieldLabel className="mb-[7px]">SKU / Code</FieldLabel>
                <TextInput mono defaultValue="CEM-OPC53" />
            </div>
            <div>
                <FieldLabel className="mb-[7px]">Unit</FieldLabel>
                <TextInput defaultValue="bag" />
            </div>
        </div>
        <div>
            <FieldLabel className="mb-[7px]">Item name</FieldLabel>
            <TextInput defaultValue="Ambuja OPC 53 Grade Cement" />
        </div>
        <div style={col}>
            <div>
                <FieldLabel className="mb-[7px]">Quantity</FieldLabel>
                <TextInput mono defaultValue="240" />
            </div>
            <div>
                <FieldLabel className="mb-[7px]">Selling ₹</FieldLabel>
                <TextInput mono defaultValue="410" />
            </div>
        </div>
    </Drawer>
);
