<?php

use Illuminate\Support\Facades\Route;




Route::get('/', function () {
    return view('welcome');
});


Route::get('/reset-password/{token}', function ($token) {
    return redirect(
        rtrim(config('app.frontend_url'), '/') . '/reset-password/' .
        $token .
        '?email=' .
        urlencode(request('email'))
    );
})->name('password.reset');
