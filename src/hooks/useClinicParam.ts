import { useLocation } from 'react-router-dom';

export const useClinicParam = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    return params.get('clinic') || '';
};
