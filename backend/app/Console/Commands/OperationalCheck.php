<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OperationalCheck extends Command
{
    protected $signature='edupath:operations-check {--url= : Public backend origin, including any path prefix; checks raw document denial with a disposable canary} {--production : Fail on unsafe production settings and missing delivery credentials}';
    protected $description='Read-only deployment checks, with optional disposable document-access probe';

    public function handle(): int
    {
        $failed=false;
        foreach (app(\App\Services\ReadinessService::class)->checks((bool) $this->option('production')) as $check) {
            if ($check['ok']) $this->info($check['name'].': OK');
            else { $this->error($check['name'].': '.$check['message']); $failed=true; }
        }
        // Avoid secondary query errors after a failed database connection.
        try { DB::select('SELECT 1'); } catch (\Throwable) { return self::FAILURE; }
        $this->line('Public storage link: '.(is_dir(public_path('storage'))?'present':'missing (run php artisan storage:link)'));
        $this->line('Production debug exposure: '.(config('app.debug')?'debug enabled; disable APP_DEBUG for deployment':'debug disabled'));
        $this->line('Mail transport configured: '.config('mail.default').' (delivery is not proven by configuration)');
        $this->line('Firebase credentials: '.(is_file(config('services.firebase.credentials') ?: storage_path('app/firebase-credentials.json'))?'present (delivery unverified)':'missing; push cannot be delivered'));
        $this->line('Scheduler: run schedule:work locally, or schedule:run every minute in production. This command cannot prove the external scheduler is running.');
        try { $this->line('Push backlog: '.DB::table('notification_deliveries')->whereIn('status',['pending','failed'])->count()); }
        catch (\Throwable) { $this->error('Push backlog unavailable; check applied migrations.'); $failed=true; }
        if($base=$this->option('url')) {
            if(!filter_var($base,FILTER_VALIDATE_URL) || !in_array(parse_url($base,PHP_URL_SCHEME),['http','https'],true)){$this->error('Use an HTTP(S) backend URL.');return self::FAILURE;}
            $path='documents/edupath-probe-'.Str::uuid().'.txt';$content=Str::random(40);
            try {
                if(!Storage::disk('public')->put($path,$content))throw new \RuntimeException('Canary could not be written.');
                $response=Http::timeout(10)->get(rtrim($base,'/').'/storage/'.$path);
                if(in_array($response->status(),[401,403,404],true) && !str_contains($response->body(),$content))$this->info('Raw document access probe: denied (HTTP '.$response->status().')');
                else {$this->error('Raw document access probe: FAILED (HTTP '.$response->status().'); review web-server protection.');$failed=true;}
            }catch(\Throwable){$this->error('Raw document access probe: unavailable or failed.');$failed=true;}
            finally {Storage::disk('public')->delete($path);}
        }else{$this->warn('Raw document access: unverified; supply --url with the deployed backend URL.'); if ($this->option('production')) $failed=true;}
        $this->warn('Configuration checks do not prove email/device delivery, scheduler execution, backups or browser acceptance. Verify these before go-live.');
        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
