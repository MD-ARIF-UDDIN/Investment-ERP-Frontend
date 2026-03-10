const BASE_URL = import.meta.env.VITE_API_URL || 'https://investment-erp.onrender.com';

export const API_BASE_URL = `${BASE_URL}/api`;
export const FILE_BASE_URL = BASE_URL;

export default {
    API_BASE_URL,
    FILE_BASE_URL,
};
