import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface ClinicLinkProps {
    to: string;
    children: React.ReactNode;
    className?: string;
    id?: string;
}

const ClinicLink = ({ to, children, className, id }: ClinicLinkProps) => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const clinic = params.get('clinic');
    const href = clinic ? `${to}${to.includes('?') ? '&' : '?'}clinic=${clinic}` : to;

    return (
        <Link to={href} className={className} id={id}>
            {children}
        </Link>
    );
};

export default ClinicLink;
