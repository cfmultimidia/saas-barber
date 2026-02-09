import { useState } from 'react';
import './Input.css';

export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    helperText,
    icon,
    required = false,
    disabled = false,
    fullWidth = true,
    mask,
    maxLength,
    className = '',
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);

    const handleChange = (e) => {
        let newValue = e.target.value;

        // Phone mask: (XX) XXXXX-XXXX
        if (mask === 'phone') {
            newValue = newValue.replace(/\D/g, '');
            if (newValue.length <= 11) {
                newValue = newValue.replace(/^(\d{2})(\d)/g, '($1) $2');
                newValue = newValue.replace(/(\d{5})(\d)/, '$1-$2');
            }
        }

        // Currency mask
        if (mask === 'currency') {
            newValue = newValue.replace(/\D/g, '');
            newValue = (parseInt(newValue) / 100).toFixed(2);
            newValue = 'R$ ' + newValue.replace('.', ',');
        }

        onChange?.({ ...e, target: { ...e.target, value: newValue } });
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className={`input-wrapper ${fullWidth ? 'input-full' : ''} ${className}`}>
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}
            <div className={`input-container ${focused ? 'focused' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    type={inputType}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="input-field"
                    {...props}
                />
                {type === 'password' && (
                    <button
                        type="button"
                        className="input-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}
            </div>
            {(error || helperText) && (
                <span className={`input-helper ${error ? 'error' : ''}`}>
                    {error || helperText}
                </span>
            )}
        </div>
    );
}
