import { useSkipLink } from '../hooks/useAccessibility';

interface SkipLinkProps {
    href?: string;
    children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
    href = '#main-content', 
    children 
}) => {
    const { skipToContent } = useSkipLink();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        skipToContent();
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {children}
        </a>
    );
};

export default SkipLink;