<?php

use Illuminate\Support\Facades\Route;




Route::get('/', function () {
    return view('welcome');
});


Route::get('/reset-password/{token}', function ($token) {
    return redirect(
        'http://localhost:5173/reset-password/' .
        $token .
        '?email=' .
        urlencode(request('email'))
    );
})->name('password.reset');
