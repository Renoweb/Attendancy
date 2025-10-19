module.exports = {
    theme: {
        extend: {
            colors: {
                glassBlue: 'rgba(0, 150, 255, 0.4)',
                glassWhite: 'rgba(255,255,255,0.3)',
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                md: '8px',
                lg: '16px',
            }
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
        // …other plugins
    ],
}
