import './Rating.css';

export default function Rating({
    value = 0,
    onChange,
    size = 'md',
    readonly = false,
    showLabel = false,
}) {
    const labels = ['', 'Ruim', 'Poderia melhorar', 'Bom', 'Muito Bom', 'Excelente!'];
    const emojis = ['', '😞', '😕', '😐', '😊', '😍'];

    const handleClick = (rating) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    return (
        <div className={`rating rating-${size}`}>
            <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`rating-star ${star <= value ? 'active' : ''}`}
                        onClick={() => handleClick(star)}
                        disabled={readonly}
                    >
                        ★
                    </button>
                ))}
            </div>
            {showLabel && value > 0 && (
                <span className="rating-label">
                    {emojis[value]} {labels[value]}
                </span>
            )}
        </div>
    );
}

// Display-only rating
Rating.Display = function RatingDisplay({ value, count, size = 'sm' }) {
    return (
        <div className={`rating-display rating-${size}`}>
            <span className="rating-value">⭐ {value?.toFixed(1) || '0.0'}</span>
            {count !== undefined && (
                <span className="rating-count">({count})</span>
            )}
        </div>
    );
};
