<?php

namespace Tests\Feature;

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class FreeDemoProxyTest extends TestCase
{
    public function test_demo_trusts_https_and_client_ip_only_from_the_local_connector(): void
    {
        $previous = [$_SERVER['EDUPATH_DEMO_MODE'] ?? null, $_ENV['EDUPATH_DEMO_MODE'] ?? null];
        try {
            $_SERVER['EDUPATH_DEMO_MODE'] = $_ENV['EDUPATH_DEMO_MODE'] = 'true';
            $this->refreshApplication();
            Route::get('/api/demo-proxy-fixture', fn (Request $request) => [
                'secure' => $request->isSecure(), 'ip' => $request->ip(),
                'link' => url('/storage/avatars/fixture.png'),
            ]);
            $forwarded = ['HTTP_HOST' => 'fixture.trycloudflare.com', 'HTTP_X_FORWARDED_PROTO' => 'https', 'HTTP_X_FORWARDED_FOR' => '198.51.100.24'];
            $this->withServerVariables($forwarded + ['REMOTE_ADDR' => '127.0.0.1'])
                ->getJson('http://fixture.trycloudflare.com/api/demo-proxy-fixture')
                ->assertOk()->assertJsonPath('secure', true)
                ->assertJsonPath('ip', '198.51.100.24')
                ->assertJsonPath('link', 'https://fixture.trycloudflare.com/storage/avatars/fixture.png');
            $this->withServerVariables($forwarded + ['REMOTE_ADDR' => '203.0.113.50'])
                ->getJson('http://fixture.trycloudflare.com/api/demo-proxy-fixture')
                ->assertOk()->assertJsonPath('secure', false)->assertJsonPath('ip', '203.0.113.50');
        } finally {
            foreach (['server', 'env'] as $index => $type) {
                if ($type === 'server') {
                    if ($previous[$index] === null) unset($_SERVER['EDUPATH_DEMO_MODE']);
                    else $_SERVER['EDUPATH_DEMO_MODE'] = $previous[$index];
                } else {
                    if ($previous[$index] === null) unset($_ENV['EDUPATH_DEMO_MODE']);
                    else $_ENV['EDUPATH_DEMO_MODE'] = $previous[$index];
                }
            }
            TrustProxies::flushState();
            Request::setTrustedProxies([], -1);
        }
    }
}
