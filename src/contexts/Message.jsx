import { useState, useEffect } from 'react';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Base_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";
  console.log("Base_URL:", Base_URL);

  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user?._id ? user._id.toString() : null;
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
    }
    return null;
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${Base_URL}/message/${conversationId}`, {
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
      const rawMessages = data.messages || data || [];
      const currentUserId = getCurrentUserId();
      
      // Add isOwn flag based on sender matching current user _id
      const updatedMessages = rawMessages.map(msg => ({
        ...msg,
        sender: msg.sender ? msg.sender.toString() : null,
        isOwn: currentUserId && msg.sender ? msg.sender.toString() === currentUserId : false,
      }));
      
      setMessages(updatedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text, receiver) => {
    if (!conversationId || !text.trim() || !receiver) return false;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${Base_URL}/message/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          conversationId,
          receiver,
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch messages after send to update with isOwn
      await fetchMessages();
      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message);
      return false;
    }
  };

  const editMessage = async (messageId, newText) => {
    if (!conversationId || !messageId || !newText.trim()) return false;
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error("User ID not found");
      }
      const response = await fetch(`${Base_URL}/message/edit/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: currentUserId,
          text: newText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch messages after edit to update UI
      await fetchMessages();
      return true;
    } catch (err) {
      console.error("Error editing message:", err);
      setError(err.message);
      return false;
    }
  };

  const deleteMessage = async (messageId) => {
    if (!conversationId || !messageId) return false;
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error("User ID not found");
      }
      const response = await fetch(`${Base_URL}/message/delete/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch messages after delete to update UI
      await fetchMessages();
      return true;
    } catch (err) {
      console.error("Error deleting message:", err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  return { messages, loading, error, sendMessage, editMessage, deleteMessage, refetch: fetchMessages };
};