<?php

namespace Tests\Feature;

use EduPath\Demo\DemoRouter;
use PHPUnit\Framework\TestCase;

require_once __DIR__.'/../../../deployment/DemoRouter.php';

class FreeDemoRouterTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir().'/edupath-demo-'.bin2hex(random_bytes(6));
        foreach (['web/assets', 'public/documents', 'public/avatars'] as $path) {
            mkdir($this->directory.'/'.$path, 0700, true);
        }
        file_put_contents($this->directory.'/web/index.html', '<div id="root"></div>');
        file_put_contents($this->directory.'/web/assets/app.js', 'console.log("fixture");');
        file_put_contents($this->directory.'/public/avatars/avatar.png', 'fixture');
        file_put_contents($this->directory.'/public/documents/private.pdf', 'private fixture');
        file_put_contents($this->directory.'/public/avatars/source.php', '<?php echo "private";');
    }

    protected function tearDown(): void
    {
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->directory, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $file) {
            if ($file->isDir()) rmdir($file->getPathname());
            else unlink($file->getPathname());
        }
        rmdir($this->directory);
    }

    private function resolve(string $uri): array
    {
        return DemoRouter::resolve($uri, $this->directory.'/web', $this->directory.'/public');
    }

    public function test_api_and_health_use_laravel_while_browser_routes_use_the_spa(): void
    {
        foreach (['/api', '/api/programs?search=BS', '/api/applicant/admissions', '/up'] as $uri) {
            $this->assertSame(['type' => 'laravel'], $this->resolve($uri));
        }
        foreach (['/', '/login', '/admin/online-exams', '/reset-password/fixture?email=user%40example.test'] as $uri) {
            $this->assertSame('text/html', $this->resolve($uri)['mime']);
        }
        $this->assertSame('text/javascript', $this->resolve('/assets/app.js')['mime']);
        $this->assertSame(404, $this->resolve('/assets/missing.js')['status']);
    }

    public function test_private_documents_and_sensitive_or_encoded_paths_are_never_served(): void
    {
        foreach ([
            '/storage/documents/private.pdf', '/STORAGE/DOCUMENTS/private.pdf',
            '/storage/%64ocuments/private.pdf', '/storage%252fdocuments%252fprivate.pdf',
            '/storage/avatars/../documents/private.pdf', '/storage\\documents\\private.pdf',
            '/storage/avatars/source.php', '/.env', '/backend/.env', '/.git/config',
            '/%252e%252e/backend/.env', '/storage/avatars/avatar.png%00.php',
            '/C:/Windows/win.ini', '/%0d%0aheader',
        ] as $uri) {
            $this->assertSame(403, $this->resolve($uri)['status'], $uri);
        }
        $this->assertSame(404, $this->resolve('/backend/app/Models/User.php')['status']);
        $this->assertSame(404, $this->resolve('/storage/missing.pdf')['status']);
        $this->assertSame('image/png', $this->resolve('/storage/avatars/avatar.png')['mime']);
    }

    public function test_missing_frontend_does_not_falsely_return_a_successful_page(): void
    {
        unlink($this->directory.'/web/index.html');
        $this->assertSame(503, $this->resolve('/login')['status']);
    }
}
