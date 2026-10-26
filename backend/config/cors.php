<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',',
        env('CORS_ALLOWED_ORIGINS', env('APP_ENV', 'production') === 'production'
            ? env('FRONTEND_URL', env('APP_URL', ''))
            : 'http://localhost:5173,http://127.0.0.1:5173')
    )))),
    'allowed_origins_patterns' => env('APP_ENV', 'production') === 'production' ? [] : [
        '#^http://(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):5173$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
