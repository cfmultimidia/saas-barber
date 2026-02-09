import './Card.css';

export default function Card({
    children,
    variant = 'default',
    clickable = false,
    selected = false,
    padding = 'md',
    onClick,
    className = '',
    ...props
}) {
    const classes = [
        'card',
        `card-${variant}`,
        `card-padding-${padding}`,
        clickable && 'card-clickable',
        selected && 'card-selected',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
}

// Sub-components
Card.Header = function CardHeader({ children, className = '' }) {
    return <div className={`card-header ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }) {
    return <div className={`card-body ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
    return <div className={`card-footer ${className}`}>{children}</div>;
};
