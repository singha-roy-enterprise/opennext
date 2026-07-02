import { Field } from "singha-roy-enterprise";
import { FiUser, FiLock, FiMail } from "react-icons/fi";

const box: React.CSSProperties = { maxWidth: 360, padding: 8 };

export const SignInFields = () => (
    <div style={box}>
        <Field label="Username or email" icon={<FiUser size={15} />} defaultValue="debarishi-sr" />
        <Field label="Password" type="password" icon={<FiLock size={15} />} defaultValue="admin123" />
    </div>
);

export const WithTrailing = () => (
    <div style={box}>
        <Field
            label="Email"
            type="email"
            icon={<FiMail size={15} />}
            placeholder="you@example.com"
            trailing={<span style={{ fontSize: 11, color: "#7a746a", fontFamily: "var(--font-mono)" }}>optional</span>}
        />
    </div>
);
