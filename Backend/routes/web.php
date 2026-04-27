<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $spaEntry = public_path('spa/index.html');

    if (is_file($spaEntry)) {
        return response()->file($spaEntry);
    }

    return view('welcome');
});

Route::get('/docs', fn () => view('docs'));

Route::get('/docs/openapi.yaml', function () {
    $path = resource_path('docs/openapi.yaml');

    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => 'application/yaml; charset=utf-8',
    ]);
});

Route::get('/{any}', function () {
    $spaEntry = public_path('spa/index.html');

    abort_unless(is_file($spaEntry), 404);

    return response()->file($spaEntry);
})->where('any', '^(?!api|docs|up).*$');
