const digitFormatter = digit => digit.toLocaleString('id-ID');
const dateFormatter = date => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};