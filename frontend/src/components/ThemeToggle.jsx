import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
    const [isLight, setIsLight] = useState(false);

    const toggleTheme = () => {
        setIsLight(!isLight);
    };

    useEffect(() => {
        if (isLight) {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    }, [isLight]);

    return (
        <Button onClick={toggleTheme} className="theme-toggle-button">
            {isLight ? 'Темная тема' : 'Светлая тема'}
        </Button>
    );
};

export default ThemeToggle;