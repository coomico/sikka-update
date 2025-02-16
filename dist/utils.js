const digitFormatter = digit => {
    // Check if the input is a valid number
    if (digit === undefined || digit === null || isNaN(Number(digit))) {
        console.warn('Invalid digit value:', digit);
        return '0'; // Return zero for undefined/null/invalid values
    }
    return Number(digit).toLocaleString('id-ID');
};

const dateFormatter = (date, useShortFormat = false) => {
    // Handle case where date is undefined or null
    if (date === undefined || date === null) {
        console.warn('Invalid date: undefined or null');
        return '-'; // Return a placeholder for undefined/null dates
    }
    
    // Check if the input is already a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return String(date); // Return the original value if it's not a valid date
    }
    
    if (useShortFormat) {
        return dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    
    return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const formatCurrency = (amount) => {
    // Handle case where amount is undefined or null
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
        console.warn('Invalid amount:', amount);
        return 'Rp 0'; // Return zero for undefined/null/invalid values
    }
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(Number(amount));
};

function updateDisplay(card, defaultContent, compactContent) {
    const cardContent = card.querySelector('#cardContent');
    if (cardContent) {
        cardContent.innerHTML = window.innerWidth < 576 ? compactContent : defaultContent;
    }
}

// Store timeouts per card using a WeakMap
const resizeTimeouts = new WeakMap();

window.addEventListener('resize', () => {
    // Get all cards and update their display
    const cards = document.querySelectorAll('.card-style');
    cards.forEach(card => {
        // Clear existing timeout for this specific card
        const existingTimeout = resizeTimeouts.get(card);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set new timeout for this card
        const newTimeout = setTimeout(() => {
            const defaultContent = card.getAttribute('data-default-content');
            const compactContent = card.getAttribute('data-compact-content');
            if (defaultContent && compactContent) {
                updateDisplay(card, defaultContent, compactContent);
            }
        }, 250);

        // Store the new timeout for this card
        resizeTimeouts.set(card, newTimeout);
    });
});