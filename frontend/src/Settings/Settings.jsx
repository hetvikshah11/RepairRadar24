import React, { useEffect, useState } from "react";
import "./settings.css";
import api from "../axiosConfig";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Please log in first.");
            navigate("/");
            return;
        }
    }, [])

    const handleNameChange = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem("token"); // stored when user logged in
            if (!token) {
                navigate('/');
            }

            await api.put(
                "/api/update-name",
                { name }, // body
                {
                    headers: { authorization: `Bearer ${token}` }
                }
            ).then((resp) => {
                if (resp.status === 200) {
                    alert("Name updated successfully to " + resp.data.name);
                    sessionStorage.setItem("name", resp.data.name);
                    setName(resp.data.name);
                }
            })
        } catch (err) {
            console.error("Error updating business name:", err);
            return { success: false, message: err.response?.data?.message || err.message };
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        console.log("New password:", password);
        // TODO: Call API to update password
    };

    return (
        <div className="settings-container">
            <div className="settings-content">
                {/* Section: Personal Information */}
                <div className="settings-section">
                    <h2>Personal Information</h2>
                    <hr />

                    <form onSubmit={handleNameChange} className="settings-form">
                        <label>Change Name</label>
                        <input
                            type="text"
                            placeholder="Enter new name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button type="submit">Update Name</button>
                    </form>

                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <label>Change Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="submit">Update Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
