module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        env: {
            production: {
                // Strip debug logs in production but keep error/warn so real
                // problems still surface in the console (and to telemetry).
                plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
            },
        },
    };
};
