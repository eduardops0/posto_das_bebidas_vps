<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialSellerForm;
use App\Http\Controllers\WorkflowController;

Route::post('/ig/callback', [SocialSellerForm::class, 'igCallback'])
    ->name('social-callback-api');

Route::post('/jobs/leonardo-daily', [SocialSellerForm::class, 'job_leonardo'])->name('social-leo-inserir');

Route::post('/gerar_json_workflow', [WorkflowController::class, 'gerarJsonWorkflow'])
    ->name('gerar-json-workflow');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
