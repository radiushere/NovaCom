import axios from 'axios';

const BRIDGE_URL = "http://localhost:3001/api";

export const callBackend = async (action, params = []) => {
    try {
        const response = await axios.post(BRIDGE_URL, {
            action: action,
            params: params
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};