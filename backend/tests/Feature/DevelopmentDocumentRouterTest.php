<?php

namespace Tests\Feature;

use Tests\TestCase;

class DevelopmentDocumentRouterTest extends TestCase
{
    public function test_development_router_denies_private_document_urls_before_static_serving(): void
    {
        $previous = $_SERVER['REQUEST_URI'] ?? null;
        try {
            foreach ([
                '/storage/documents/canary.txt',
                '/STORAGE/DOCUMENTS/canary.pdf',
                '/storage/%64ocuments/canary.txt',
                '/storage%2fdocuments%2fcanary.txt',
                '/storage%252fdocuments%252fcanary.txt',
                '/storage/avatars/../documents/canary.txt',
                '/storage\\documents\\canary.txt',
            ] as $uri) {
                $_SERVER['REQUEST_URI'] = $uri;
                ob_start();
                $result = (static fn () => require base_path('server.php'))();
                $body = ob_get_clean();
                $this->assertTrue($result, $uri);
                $this->assertSame(403, http_response_code(), $uri);
                $this->assertStringContainsString('requires authentication', $body);
            }
        } finally {
            if ($previous === null) unset($_SERVER['REQUEST_URI']);
            else $_SERVER['REQUEST_URI'] = $previous;
            http_response_code(200);
        }
    }

    public function test_development_router_preserves_public_static_assets(): void
    {
        $previous = $_SERVER['REQUEST_URI'] ?? null;
        try {
            $_SERVER['REQUEST_URI'] = '/robots.txt';
            $this->assertFalse((static fn () => require base_path('server.php'))());
        } finally {
            if ($previous === null) unset($_SERVER['REQUEST_URI']);
            else $_SERVER['REQUEST_URI'] = $previous;
        }
    }
}
