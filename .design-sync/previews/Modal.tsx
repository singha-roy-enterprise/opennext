import { Modal, Button } from "singha-roy-enterprise";
import { FiTrash2 } from "react-icons/fi";

const noop = () => {};

export const DeleteConfirm = () => (
    <Modal onClose={noop} width="380px" className="rounded-[4px] p-6">
        <div
            style={{
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(190,58,40,.35)",
                background: "rgba(190,58,40,.08)",
                color: "#be3a28",
                borderRadius: 3,
                marginBottom: 16,
            }}
        >
            <FiTrash2 size={22} />
        </div>
        <h3 style={{ margin: "0 0 7px", fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600 }}>
            Delete item?
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, lineHeight: 1.5, color: "#4a453d" }}>
            &ldquo;Ambuja OPC 53 Grade Cement&rdquo; will be permanently removed from inventory.
        </p>
        <div style={{ display: "flex", gap: 11 }}>
            <Button variant="outline" className="flex-1 p-3">
                Cancel
            </Button>
            <Button variant="danger" className="flex-1 p-3">
                Delete
            </Button>
        </div>
    </Modal>
);
