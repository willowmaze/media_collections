import { useState, useRef } from 'react';

export const useScroll = () => {
    const scrollRef = useRef(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        setIsDown(true);
        scrollRef.current.classList.add('scroll-auto');
        scrollRef.current.classList.remove('snap-x', 'snap-mandatory');

        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeftState(scrollRef.current.scrollLeft);
    };

    const stopScrolling = () => {
        if (!isDown) return;
        setIsDown(false);
        scrollRef.current.classList.remove('scroll-auto');
        scrollRef.current.classList.add('snap-x', 'snap-mandatory');
    };

    const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeftState - walk;
    };

    return {
        ref: scrollRef,
        isDown,
        events: {
            onMouseDown,
            onMouseLeave: stopScrolling,
            onMouseUp: stopScrolling,
            onMouseMove
        }
    };
};