import React, { useEffect, useState, useRef } from "react";
import "./settings.css";
import api from "../axiosConfig";
import { useNavigate } from "react-router-dom";
import { FaPen, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("personal");

    const [name, setName] = useState("");
    const [originalName, setOriginalName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // WhatsApp Messages
    const [messages, setMessages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [messageName, setMessageName] = useState("");
    const [customText, setCustomText] = useState("");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const customTextRef = useRef(null);

    // Jobcard Schema
    const [jobCardSchema, setJobCardSchema] = useState(null);

    // Customer Details
    const [customers, setCustomers] = useState([]);

    // 👈 NEW: Saved Items
    const [itemName, setItemName] = useState(""); 
    const [savedItems, setSavedItems] = useState([]); 

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Please log in first.");
            navigate("/");
            return;
        }

        const storedName = sessionStorage.getItem("userName");
        if (storedName) {
            setName(storedName);
            setOriginalName(storedName);
        }

        fetchMessages();
        fetchSchema();
        fetchCustomers();
        fetchSavedItems(); // 👈 NEW: Fetch saved items on load
    }, [navigate]);

    const fetchMessages = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get("/user/whatsapp/get-messages", {
                headers: { authorization: `Bearer ${token}` },
            });
            setMessages(res.data || []);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get("/user/customerdetails", {
                headers: { authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setCustomers(res.data.customers || []);
            } else {
                console.error("Failed to fetch customers:", res.data.message);
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please log in again.");
                navigate("/");
            }
        }
    };

    // 👈 NEW: Function to fetch saved items
    const fetchSavedItems = async () => {
        try {
            const token = sessionStorage.getItem("token");
            // Assuming a new route /user/items
            const res = await api.get("/user/items", {
                headers: { authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setSavedItems(res.data.items || []);
            } else {
                console.error("Failed to fetch items:", res.data.message);
            }
        } catch (err) {
            console.error("Error fetching items:", err);
        }
    };

    // 👈 NEW: Function to add a new item
    const handleAddItem = async (e) => {
        e.preventDefault();
        const trimmedItemName = itemName.trim();
        if (!trimmedItemName) {
            alert("Please enter an item name.");
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            const payload = { item_name: trimmedItemName };
            
            // Assuming POST /user/items
            const res = await api.post("/user/items", payload, {
                headers: { authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                alert("Item added successfully.");
                // Add the new item to local state (assuming backend returns the new item)
                setSavedItems([...savedItems, res.data.item]);
                setItemName(""); // Clear the input
            } else {
                alert(res.data.message || "Failed to add item.");
            }
        } catch (err) {
            console.error("Error adding item:", err);
            alert(err.response?.data?.message || "Failed to add item.");
        }
    };

    // 👈 NEW: Function to delete a saved item
    const handleDeleteItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const token = sessionStorage.getItem("token");
            // Assuming DELETE /user/items/:id
            const res = await api.delete(`/user/items/${id}`, {
                headers: { authorization: `Bearer ${token}` },
            });

            if (res.status === 200) {
                alert("Item deleted successfully.");
                // Update state locally
                setSavedItems(prevItems =>
                    prevItems.filter(item => item._id !== id)
                );
            } else {
                alert(res.data.message || "Failed to delete item.");
            }
        } catch (err) {
            console.error("Error deleting item:", err);
            alert(err.response?.data?.message || "Failed to delete item.");
        }
    };


    const handleDeleteCustomer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;

        try {
            const token = sessionStorage.getItem("token");
            const res = await api.delete(`/user/customerdetails/${id}`, {
                headers: { authorization: `Bearer ${token}` },
            });

            if (res.status === 200) {
                alert("Customer deleted successfully.");
                setCustomers(prevCustomers =>
                    prevCustomers.filter(customer => customer._id !== id)
                );
            } else {
                alert(res.data.message || "Failed to delete customer.");
            }
        } catch (err) {
            console.error("Error deleting customer:", err);
            alert(err.response?.data?.message || "Failed to delete customer.");
        }
    };

    const fetchSchema = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get("/user/get-config", {
                headers: { authorization: `Bearer ${token}` },
            });
            setJobCardSchema(res.data);
        } catch (err) {
            if (err.status === 401) {
                alert("Session expired. Please log in again.");
                navigate("/");
            }
            console.error("Error fetching schema:", err);
        }
    };

    const getRelevantFields = (schema) => {
        // ... (function unchanged)
        if (!schema?.schema) return [];
        const usefulKeys = [
            "job_no",
            "customer_name",
            "customer_phone",
            "item_name",
            "item_qty",
            "item_serial",
        ];

        const fields = [];

        schema.schema.forEach((field) => {
            if (usefulKeys.includes(field.key)) {
                fields.push({ name: field.name, key: field.key });
            }

            if (field.key === "items" && Array.isArray(field.fields)) {
                field.fields.forEach((subField) => {
                    if (usefulKeys.includes(subField.key)) {
                        fields.push({ name: subField.name, key: subField.key });
                    }
                });
            }
        });

        return fields;
    };

    const handleSaveMessage = async () => {
        // ... (function unchanged)
        if (!messageName.trim()) {
            alert("Please enter a message name.");
            return;
        }

        const token = sessionStorage.getItem("token");
        if (!token) return navigate("/");

        try {
            const payload = {
                name: messageName.trim(),
                text: customText.replace(/\n/g, "\\n").trim(),
            };

            let res;
            if (editingMessageId) {
                res = await api.put(
                    `/user/whatsapp/update-message/${editingMessageId}`,
                    payload,
                    { headers: { authorization: `Bearer ${token}` } }
                );
            } else {
                res = await api.post("/user/whatsapp/create-message/", payload, {
                    headers: { authorization: `Bearer ${token}` },
                });
            }

            if (res.status === 200 || res.status === 201) {
                alert(`Message ${editingMessageId ? "updated" : "created"} successfully`);
                setShowModal(false);
                setEditingMessageId(null);
                setMessageName("");
                setCustomText("");
                fetchMessages();
            }
        } catch (err) {
            console.error("Error saving message:", err);
            alert("Failed to save message.");
        }
    };

    const handleDeleteMessage = async (id) => {
        // ... (function unchanged)
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const token = sessionStorage.getItem("token");
            await api.delete(`/user/whatsapp/delete-message/${id}`, {
                headers: { authorization: `Bearer ${token}` },
            });
            setMessages(messages.filter((m) => m._id !== id));
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("Failed to delete message.");
        }
    };

    const openEditModal = (msg) => {
        // ... (function unchanged)
        setEditingMessageId(msg._id);
        setMessageName(msg.name);
        setCustomText(msg.text);
        setShowModal(true);
    };

    const handleNameChange = async (e) => {
        // ... (function unchanged)
        e.preventDefault();
        try {
            const token = sessionStorage.getItem("token");
            if (!token) navigate("/");

            const resp = await api.put(
                "/api/update-name",
                { name },
                { headers: { authorization: `Bearer ${token}` } }
            );

            if (resp.status === 200) {
                alert("Name updated successfully to " + resp.data.name);
                sessionStorage.setItem("userName", resp.data.name);
                setName(resp.data.name);
                setOriginalName(resp.data.name);
                setIsEditingName(false);
            }
        } catch (err) {
            console.error("Error updating business name:", err);
        }
    };

    const handleVerifyPassword = async (e) => {
        // ... (function unchanged)
        e.preventDefault();
        try {
            const token = sessionStorage.getItem("token");
            if (!token) navigate("/");

            const resp = await api.post(
                "/api/verify-password",
                { currentPassword },
                { headers: { authorization: `Bearer ${token}` } }
            );

            if (resp.status === 200 && resp.data.verified) {
                alert("Password verified successfully.");
                setIsVerified(true);
            } else {
                alert("Incorrect password. Please try again.");
            }
        } catch (err) {
            console.error("Error verifying password:", err);
            alert(err.response?.data?.message || "Verification failed.");
        }
    };

    const handlePasswordChange = async (e) => {
        // ... (function unchanged)
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            if (!token) navigate("/");

            const resp = await api.put(
                "/api/update-password",
                { password },
                { headers: { authorization: `Bearer ${token}` } }
            );

            if (resp.status === 200) {
                alert("Password updated successfully.");
                setCurrentPassword("");
                setPassword("");
                setConfirmPassword("");
                setIsVerified(false);
            }
        } catch (err) {
            console.error("Error updating password:", err);
            alert(err.response?.data?.message || "Password update failed.");
        }
    };

    const insertField = (key) => {
        // ... (function unchanged)
        if (!customTextRef.current) return;
        const textarea = customTextRef.current;
        const cursorPos = textarea.selectionStart;
        const textBefore = customText.slice(0, cursorPos);
        const textAfter = customText.slice(cursorPos);

        const newText = `${textBefore}{${key}}${textAfter}`;
        setCustomText(newText);

        setTimeout(() => {
            const newCursorPos = cursorPos + key.length + 2;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div style={{ margin: "0px" }}>
            <Navbar />
            <div className="settings-layout">
                {/* Left Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}
                        onClick={() => setActiveTab("personal")}
                    >
                        Personal Information
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "whatsapp" ? "active" : ""}`}
                        onClick={() => setActiveTab("whatsapp")}
                    >
                        WhatsApp Messages
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "customerdetails" ? "active" : ""}`}
                        onClick={() => setActiveTab("customerdetails")}
                    >
                        Customer Details
                    </button>
                    {/* 👈 NEW: Saved Items Tab Button */}
                    <button
                        className={`tab-btn ${activeTab === "saveditems" ? "active" : ""}`}
                        onClick={() => setActiveTab("saveditems")}
                    >
                        Saved Items
                    </button>
                </div>

                {/* Right Content */}
                <div className="settings-right">
                    {activeTab === "personal" && (
                        <>
                           {/* ... (personal info content unchanged) ... */}
                            <h2>Personal Information</h2>
                            <hr />
                            <form onSubmit={handleNameChange} className="settings-form">
                                <label>Change Name</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        placeholder="Enter new name"
                                        value={name}
                                        disabled={!isEditingName}
                                        onChange={(e) => setName(e.target.value)}
                                        className="light-input"
                                    />
                                    <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        <FaPen />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={name === originalName}
                                    className="update-btn"
                                >
                                    Update Name
                                </button>
                            </form>

                            <div className="settings-form">
                                <label>Change Password</label>
                                <form onSubmit={handleVerifyPassword} className="settings-form">
                                    <input
                                        type="password"
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        disabled={isVerified}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="light-input"
                                    />
                                    {!isVerified && (
                                        <button type="submit" className="update-btn">
                                            Verify
                                        </button>
                                    )}
                                </form>

                                {isVerified && (
                                    <form onSubmit={handlePasswordChange} className="settings-form">
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="light-input"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="light-input"
                                        />
                                        <button type="submit" className="update-btn">
                                            Update Password
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "whatsapp" && (
                        <>
                           {/* ... (whatsapp content unchanged) ... */}
                            <h2>WhatsApp Messages</h2>
                            <hr />
                            <div className="whatsapp-scroll">
                                {messages.map((msg) => (
                                    <div key={msg._id} className="message-card">
                                        <h4>{msg.name}</h4>
                                        <p className="msg-preview">{msg.text.slice(0, 80)}...</p>
                                        <div className="msg-actions">
                                            <button className="icon-btn" onClick={() => openEditModal(msg)}>
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="icon-btn delete-btn"
                                                onClick={() => handleDeleteMessage(msg._id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div
                                    className="message-card create-card"
                                    onClick={() => setShowModal(true)}
                                >
                                    <FaPlus size={24} />
                                    <span>Create</span>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "customerdetails" && (
                        <>
                            {/* ... (customer details content unchanged) ... */}
                            <h2>Customer Details</h2>
                            <hr />
                            <div className="customer-table-container">
                                <table className="customer-table">
                                    <thead>
                                        <tr>
                                            <th>Customer Name</th>
                                            <th>Customer Phone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.length > 0 ? (
                                            customers.map((customer) => (
                                                <tr key={customer._id}>
                                                    <td>{customer.customer_name}</td>
                                                    <td>{customer.customer_phone}</td>
                                                    <td>
                                                        <button
                                                            className="icon-btn delete-btn"
                                                            onClick={() => handleDeleteCustomer(customer._id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: "center" }}>
                                                    No customers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* 👈 NEW: Saved Items Tab Content */}
                    {activeTab === "saveditems" && (
                        <>
                            <h2>Saved Items</h2>
                            <hr />

                            {/* Add Item Form */}
                            <form onSubmit={handleAddItem} className="settings-form saved-item-form">
                                <label>Add New Item</label>
                                <div className="input-with-button">
                                    <input
                                        type="text"
                                        placeholder="Enter item name (e.g., Laptop, Mobile)"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        className="light-input"
                                    />
                                    <button type="submit" className="add-btn">
                                        <FaPlus /> Add
                                    </button>
                                </div>
                            </form>

                            {/* List of Saved Items */}
                            <div className="saved-items-list-container">
                                <h4>Existing Items</h4>
                                {savedItems.length > 0 ? (
                                    <ul className="saved-items-list">
                                        {savedItems.map((item) => (
                                            <li key={item._id}>
                                                <span>{item.item_name}</span>
                                                <button
                                                    className="icon-btn delete-btn"
                                                    onClick={() => handleDeleteItem(item._id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>
                                        No saved items found.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    {/* ... (modal content unchanged) ... */}
                    <div className="modal-content modal-grid">
                        <div className="modal-left">
                            <h3>{editingMessageId ? "Edit Message" : "Create New Message"}</h3>

                            <label>Message Name</label>
                            <input
                                type="text"
                                value={messageName}
                                onChange={(e) => setMessageName(e.target.value)}
                                className="light-input"
                            />

                            <label>Message Content</label>
                            <textarea
                                ref={customTextRef}
                                rows="7"
                                value={customText.replace(/\\n/g, "\n")}
                                onChange={(e) => setCustomText(e.target.value)}
                                className="light-input"
                                placeholder="Type your message or insert fields..."
                            />

                            <div className="preview-section">
                                <h4>Message Preview</h4>
                                <div className="preview-box">
                                    <pre>{customText.replace(/\\n/g, "\n")}</pre>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="update-btn" onClick={handleSaveMessage}>
                                    Save
                                </button>
                                <button className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div className="modal-right">
                            <h4>Available Fields</h4>
                            {jobCardSchema ? (
                                <div className="field-list">
                                    {getRelevantFields(jobCardSchema).map((f) => (
                                        <button
                                            key={f.key}
                                            className="field-btn"
                                            onClick={() => insertField(f.key)}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p>Loading schema...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;