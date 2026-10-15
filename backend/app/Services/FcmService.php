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

        $credentialsPath = storage_path('app/firebase-credentials.json');
        if (!file_exists($credentialsPath)) {
            Log::warning('FCM Push Skipped: storage/app/firebase-credentials.json not found.');
            return false;
        }

        $credentials = json_decode(file_get_contents($credentialsPath), true);
        if (!$credentials || empty($credentials['project_id'])) {
            Log::error('FCM Push Failed: Invalid firebase-credentials.json format.');
            return false;
        }

        $projectId = $credentials['project_id'];
        $accessToken = $this->getAccessToken($credentials);

        if (!$accessToken) {
            Log::error('FCM Push Failed: Unable to obtain Google OAuth2 Access Token.');
            return false;
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
        $success = false;

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

                if ($response->successful()) {
                    $success = true;
                } else {
                    Log::error('FCM v1 Push Notification failed for token ' . substr($fcmToken, 0, 10) . '... Response: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::error('FCM v1 Push Exception: ' . $e->getMessage());
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

            Log::error('FCM Service: OAuth2 Token Exchange failed: ' . $response->body());
            return null;
        });
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(str_replace(['+', '/'], ['-', '_'], base64_encode($data)), '=');
    }
}
