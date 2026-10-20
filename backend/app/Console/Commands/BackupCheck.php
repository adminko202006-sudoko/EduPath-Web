<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use ZipArchive;

class BackupCheck extends Command
{
    protected $signature='edupath:backup {--verify : Restore into a new disposable database, verify data counts and row locking, then remove only that disposable database} {--mysql-bin= : Directory containing mysql and mysqldump}';
    protected $description='Create a private SQL/storage backup without changing source data, optionally verify isolated restoration';

    public function handle(): int
    {
        if(DB::getDriverName()!=='mysql'){$this->error('This command currently supports MySQL/MariaDB only.');return self::FAILURE;}
        if(!class_exists(ZipArchive::class)){$this->error('PHP ZipArchive is required.');return self::FAILURE;}
        $config=DB::connection()->getConfig();
        $windowsBin=is_file('C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe') ? 'C:/Program Files/MySQL/MySQL Server 8.0/bin' : 'C:/xampp/mysql/bin';
        $bin=$this->option('mysql-bin') ?: (PHP_OS_FAMILY==='Windows'?$windowsBin:'/usr/bin');
        $suffix=PHP_OS_FAMILY==='Windows'?'.exe':'';
        $args=['--host='.$config['host'],'--port='.($config['port'] ?? 3306),'--user='.$config['username']];
        $env=['MYSQL_PWD'=>(string)($config['password'] ?? '')];
        $directory=storage_path('app/edupath-backups/'.now()->format('Ymd-His').'-'.Str::random(8));
        if(!mkdir($directory,0700,true)){$this->error('Backup directory unavailable.');return self::FAILURE;}
        $sql=$directory.'/database.sql';$temporary=null;$stream=null;$createdTemporary=false;
        try {
            $this->runProcess(array_merge([$bin.'/mysqldump'.$suffix],$args,['--single-transaction','--quick','--skip-lock-tables','--routines','--events','--triggers','--result-file='.$sql,$config['database']]),$env);
            $manifest=['created_at'=>now()->toIso8601String(),'tables'=>[],'storage_files'=>[]];
            foreach(DB::select('SHOW TABLES') as $row){$table=array_values((array)$row)[0];$manifest['tables'][$table]=DB::table($table)->count();}
            if($this->option('verify')){
                // The generated name is never derived from a user-provided database name.
                $temporary='edupath_restore_check_'.strtolower(Str::random(12));
                $this->runProcess(array_merge([$bin.'/mysql'.$suffix],$args,['--execute=CREATE DATABASE `'.$temporary.'` CHARACTER SET utf8mb4']),$env);
                $createdTemporary=true;
                $stream=fopen($sql,'r');$restore=new Process(array_merge([$bin.'/mysql'.$suffix],$args,[$temporary]),null,$env);$restore->setInput($stream);$restore->setTimeout(300);$restore->mustRun();fclose($stream);$stream=null;
                $copy=new \PDO('mysql:host='.$config['host'].';port='.($config['port']??3306).';dbname='.$temporary,$config['username'],$config['password']??'',[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);
                foreach($manifest['tables'] as $table=>$count){$actual=(int)$copy->query('SELECT COUNT(*) FROM `'.str_replace('`','``',$table).'`')->fetchColumn();if($actual!==$count)throw new \RuntimeException('Restored row count differs. Avoid concurrent writes during verification.');}
                $copy->exec('CREATE TABLE edupath_lock_probe (id INT PRIMARY KEY, value INT) ENGINE=InnoDB');$copy->exec('INSERT INTO edupath_lock_probe VALUES (1,0)');
                $second=new \PDO('mysql:host='.$config['host'].';port='.($config['port']??3306).';dbname='.$temporary,$config['username'],$config['password']??'',[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);
                $second->exec('SET innodb_lock_wait_timeout=1');$copy->beginTransaction();$copy->query('SELECT * FROM edupath_lock_probe WHERE id=1 FOR UPDATE');
                $blocked=false;try{$second->exec('UPDATE edupath_lock_probe SET value=1 WHERE id=1');}catch(\PDOException $e){$blocked=($e->errorInfo[1]??null)===1205;}finally{$copy->rollBack();}
                if(!$blocked)throw new \RuntimeException('Native row lock probe failed.');
                $manifest['restore_verified']=true;$manifest['native_row_lock_probe']=true;
                $copy=null;$second=null;
            }
            $zip=new ZipArchive();if($zip->open($directory.'/storage.zip',ZipArchive::CREATE)!==true)throw new \RuntimeException('Cannot create storage archive.');
            try{foreach(['private','public'] as $disk){$root=storage_path('app/'.$disk);if(!is_dir($root))continue;foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root,\FilesystemIterator::SKIP_DOTS)) as $file){if(!$file->isFile()||$file->isLink())continue;$relative=$disk.'/'.str_replace('\\','/',substr($file->getPathname(),strlen($root)+1));$zip->addFile($file->getPathname(),$relative);$manifest['storage_files'][$relative]=hash_file('sha256',$file->getPathname());}}}finally{$zip->close();}
            $verify=new ZipArchive();if($verify->open($directory.'/storage.zip')!==true)throw new \RuntimeException('Cannot reopen storage backup.');
            try{foreach($manifest['storage_files'] as $name=>$hash){$data=$verify->getFromName($name);if($data===false||!hash_equals($hash,hash('sha256',$data)))throw new \RuntimeException('Storage archive verification failed.');}}finally{$verify->close();}
            $manifest['sql_sha256']=hash_file('sha256',$sql);$manifest['storage_sha256']=hash_file('sha256',$directory.'/storage.zip');
            if(file_put_contents($directory.'/manifest.json',json_encode($manifest,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES))===false)throw new \RuntimeException('Cannot write backup manifest.');
            $this->info('Backup created: '.$directory);$this->info($this->option('verify')?'Isolated SQL restore, table counts, native row lock and storage checksums passed.':'Storage checksums passed; SQL restoration not tested (use --verify).');
            return self::SUCCESS;
        }catch(\Throwable $error){report($error);$this->error('Backup/verification failed. Inspect the server log. No source database records were changed. Incomplete artifacts remain in '.$directory);return self::FAILURE;}
        finally {
            if(is_resource($stream))fclose($stream);
            if($createdTemporary && $temporary!==$config['database'] && preg_match('/^edupath_restore_check_[a-z0-9]{12}$/',$temporary)){
                $this->runProcess(array_merge([$bin.'/mysql'.$suffix],$args,['--execute=DROP DATABASE IF EXISTS `'.$temporary.'`']),$env);
            }
        }
    }

    private function runProcess(array $args,array $env): void
    {
        $process=new Process($args,null,$env);$process->setTimeout(300);$process->mustRun();
    }
}
