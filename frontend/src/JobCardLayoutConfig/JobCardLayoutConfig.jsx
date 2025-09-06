import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axiosConfig";
import "./jobcardlayoutconfig.css";

export default function JobCardLayoutConfig() {
    const navigate = useNavigate();
    const [schema, setSchema] = useState([]);
    const [layout, setLayout] = useState(""); // user-editable layout
    const [loading, setLoading] = useState(true);

    // ✅ On load → check token + fetch schemas
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Please log in first.");
            navigate("/");
            return;
        }

        const fetchData = async () => {
            try {
                // fetch jobcard schema
                const resSchema = await api.get("/user/get-config", {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (resSchema.data && resSchema.data.schema) {
                    setSchema(resSchema.data.schema);
                }

                // fetch display config
                const resDisplay = await api.get("/user/get-display-config", {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (resDisplay.data && resDisplay.data.layout) {
                    setLayout(resDisplay.data.layout);
                }
            } catch (err) {
                console.error("Error fetching configs", err);
                alert("Could not load configuration.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // ✅ Insert field into layout
    const insertField = (fieldKey, isList = false, subFieldKey = null) => {
        let insertText = "";
        if (isList && subFieldKey) {
            insertText = `<${fieldKey}.${subFieldKey}>`;
        } else {
            insertText = `<${fieldKey}>`;
        }
        setLayout((prev) => prev + insertText);
    };

    // ✅ Save layout config
    const saveLayout = async () => {
        const token = sessionStorage.getItem("token");
        try {
            await api.post(
                "/user/save-display-config",
                { layout },
                { headers: { authorization: `Bearer ${token}` } }
            );
            alert("Layout configuration saved!");
            navigate("/dashboard");
        } catch (err) {
            console.error("Error saving layout", err);
            alert("Could not save layout.");
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="layout-config-container">
            <h2>Configure Job Card Layout</h2>
            <div className="config-sections">
                {/* Left: Layout Preview */}
                <div className="preview-section">
                    <h3>Preview</h3>
                    <div className="card-preview">
                        {layout.split("\n").map((line, idx) => (
                            <p key={idx} className="preview-line">
                                {line}
                            </p>
                        ))}
                    </div>

                    <textarea
                        className="layout-editor"
                        value={layout}
                        onChange={(e) => setLayout(e.target.value)}
                        placeholder="Type your layout here... use <field_key> for fields, \n for new lines"
                    />
                </div>

                {/* Right: Available Fields */}
                <div className="fields-section">
                    <h3>Available Fields</h3>
                    <ul className="field-list">
                        {schema.map((field) => (
                            <li key={field.key} className="field-item">
                                <button
                                    className="field-btn"
                                    onClick={() => insertField(field.key)}
                                >
                                    {field.name} ({field.key})
                                </button>

                                {field.type === "list" && (
                                    <ul className="subfield-list">
                                        {field.fields.map((sub) => (
                                            <li key={sub.key}>
                                                <button
                                                    className="subfield-btn"
                                                    onClick={() =>
                                                        insertField(field.key, true, sub.key)
                                                    }
                                                >
                                                    {sub.name} ({field.key}.{sub.key})
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <button className="save-btn" onClick={saveLayout}>
                Save Layout
            </button>
        </div>
    );
}
