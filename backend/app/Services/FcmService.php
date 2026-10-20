<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send push notification using Firebase Cloud Messaging API (HTTP v1).
     *
     * @param array|string $tokens
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public function sendNotification(array|string $tokens, string $title, string $body, array $data = []): bool
    {
        $tokenList = is_array($tokens) ? array_filter($tokens) : [$tokens];
        if (empty($tokenList)) {
            return false;
        }

        $credentialsPath = config('services.firebase.credentials') ?: storage_path('app/firebase-credentials.json');
        if (!is_file($credentialsPath) || !is_readable($credentialsPath)) {
            Log::warning('FCM push unavailable: private credentials are missing or unreadable.');
            return false;
        }

        $credentials = json_decode(file_get_contents($credentialsPath), true);
        if (!$credentials || empty($credentials['project_id']) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
            Log::error('FCM push unavailable: invalid private credentials configuration.');
            return false;
        }

        $projectId = $credentials['project_id'];
        $accessToken = $this->getAccessToken($credentials);

        if (!$accessToken) {
            Log::error('FCM Push Failed: Unable to obtain Google OAuth2 Access Token.');
            return false;
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
        $success = true;

        foreach ($tokenList as $fcmToken) {
            try {
                $payload = [
                    'message' => [
                        'token' => $fcmToken,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => array_map('strval', array_merge([
                            'title' => $title,
                            'body' => $body,
                        ], $data)),
                    ],
                ];

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ])->post($url, $payload);

                if (!$response->successful()) {
                    $success = false;
                    // Provider bodies may contain private device/message details.
                    Log::error('FCM push rejected by provider.', ['http_status' => $response->status()]);
                }
            } catch (\Exception $e) {
                $success = false;
                Log::error('FCM push transport failed.', ['exception_class' => get_class($e)]);
            }
        }

        return $success;
    }

    /**
     * Generate or retrieve cached Google OAuth2 Access Token using Service Account credentials.
     */
    private function getAccessToken(array $credentials): ?string
    {
        return Cache::remember('fcm_google_access_token', 3300, function () use ($credentials) {
            $clientEmail = $credentials['client_email'] ?? null;
            $privateKey = $credentials['private_key'] ?? null;

            if (!$clientEmail || !$privateKey) {
                return null;
            }

            $now = time();
            $header = $this->base64UrlEncode(json_encode([
                'alg' => 'RS256',
                'typ' => 'JWT',
            ]));

            $claimSet = $this->base64UrlEncode(json_encode([
                'iss' => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]));

            $signatureInput = "{$header}.{$claimSet}";

            $signature = '';
            $success = openssl_sign($signatureInput, $signature, $privateKey, 'SHA256');

            if (!$success) {
                Log::error('FCM Service: Failed to sign JWT with private key.');
                return null;
            }

            $jwt = $signatureInput . '.' . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('FCM OAuth2 token exchange failed.', ['http_status' => $response->status()]);
            return null;
        });
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(str_replace(['+', '/'], ['-', '_'], base64_encode($data)), '=');
    }
}
