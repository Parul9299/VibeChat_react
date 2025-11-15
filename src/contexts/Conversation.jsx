import { useState, useEffect } from 'react';

export const useChatUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const Base_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";
    console.log("Base_URL:", Base_URL);

    const fetchChatUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${Base_URL}/conversation/chatusers`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : "",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUsers(data || []);
        } catch (err) {
            console.error("Error fetching chat users:", err);
            setError(err.message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChatUsers();
    }, []);

    return { users, loading, error };
};
