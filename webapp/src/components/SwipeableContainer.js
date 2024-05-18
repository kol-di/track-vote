import React, { useState, useRef, useEffect } from 'react';
import styles from './SwipeableContainer.module.css';

const SwipeableContainer = ({ children, onDelete }) => {
    const [isSwiped, setIsSwiped] = useState(false);
    const startX = useRef(0);
    const deleteButtonRef = useRef(null);
    const [deleteButtonWidth, setDeleteButtonWidth] = useState(0);

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        const currentX = e.touches[0].clientX;
        const diffX = startX.current - currentX;

        if (diffX > 50) {
            setIsSwiped(true);
        } else if (diffX < -50) {
            setIsSwiped(false);
        }
        e.preventDefault(); // Prevent vertical scrolling when swiping horizontally
    };

    const handleTouchEnd = () => {
        // Touch end logic can be left empty for now
    };

    useEffect(() => {
        if (deleteButtonRef.current) {
            setDeleteButtonWidth(deleteButtonRef.current.offsetWidth);
        }
    }, []);

    return (
        <div
            className={`${styles.swipeableContainer} ${isSwiped ? styles.swiped : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className={styles.swipeableContent}
                style={{
                    transform: isSwiped ? `translateX(-${deleteButtonWidth}px)` : 'translateX(0)',
                }}
            >
                {children}
            </div>
            <button
                ref={deleteButtonRef}
                className={styles.deleteButton}
                onClick={onDelete}
            >
                Delete
            </button>
        </div>
    );
};

export default SwipeableContainer;
