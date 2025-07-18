<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Route::get('/', function () {
    return view('welcome');
});

// Rutas de broadcasting con autenticación
Broadcast::routes([
    'middleware' => ['auth:api'],
]);
