<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\OrderManagementController;
use App\Http\Controllers\ProfilleController;
use App\Http\Controllers\TagsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Consultor\ConsultorController;
use App\Http\Controllers\RegistrosController;
use App\Http\Controllers\GerenciadorDePlanilhasController;
use App\Http\Middleware\VerifyCsrfToken;



Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/', function () {
        $user         = Auth::user();

        if ($user->role !== 'consultor') {
            return redirect()->route('admin-dashboard');
        }

        return redirect()->route('consultor-dashboard');
    })->name('home');
  
    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');
    Route::get('/admin/dashboard', [DashboardController::class, 'dashboard'])->name('admin-dashboard');

    Route::get('/consultor/dashboard', [ConsultorController::class, 'Dashboard'])->name('consultor-dashboard');

    Route::get('/registros', [RegistrosController::class, 'index'])->name('registros');
    Route::post('/registros', [RegistrosController::class, 'store'])->name('registros.store');


    Route::get('/gerenciar-tags', [TagsController::class, 'tagManagement'])->name('TagManagement');

    Route::get('/profile-settings', [ProfilleController::class, 'home'])->name('ProfilleSettings');

    Route::get('/admin/gerenciar-consultores', [AdminController::class, 'gerenciarConsultores'])
    ->name('gerenciar-consultores');

    Route::get('/admin/gerenciar-metas', [AdminController::class, 'gerenciador_de_metas'])
    ->name('gerenciar-metas');

    Route::get('/admin/fornecedores', [AdminController::class, 'fornecedores'])
    ->name('fornecedores');

    Route::get('/admin/gerenciador-de-planilhas', [GerenciadorDePlanilhasController::class, 'index'])
    ->name('gerenciador-de-planilhas');

    Route::get('/admin/planilhas/{id}', [GerenciadorDePlanilhasController::class, 'show'])
    ->name('planilhas.show');

    Route::patch('/admin/planilhas/{planilha}/cotacoes/{cotacao}/disable', [GerenciadorDePlanilhasController::class, 'disableCotacao']);

    Route::get('/admin-settings', function () {
        return Inertia::render('admin/AdminSettings');
    })->name('admin-settings');
});

    // ADMIN GET

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/crm', [CrmController::class, 'index'])->name('crm');


    Route::get('/admin/tasks', [AdminController::class, 'Tasks'])->name('admin.tasks');

    Route::post('/admin/consultants', [AdminController::class, 'createNewConsultant'])->name('admin.consultants.store');
    Route::put('/admin/consultants/{id}', [AdminController::class, 'updateConsultant'])->name('admin.consultants.update');
    Route::delete('/admin/consultants/{id}', [AdminController::class, 'destroyConsultant'])->name('admin.consultants.destroy');

    Route::post('/admin/goals', [AdminController::class, 'storeGoal'])->name('admin.goals.store');
    Route::put('/admin/goals/{id}', [AdminController::class, 'updateGoal'])->name('admin.goals.update');
    Route::delete('/admin/goals/{id}', [AdminController::class, 'destroyGoal'])->name('admin.goals.destroy');
    Route::patch('/admin/goals/{id}/status', [AdminController::class, 'toggleGoalStatus'])->name('admin.goals.toggle-status');

    // Fornecedores CRUD
    Route::post('/admin/fornecedores', [AdminController::class, 'storeFornecedor'])->name('admin.fornecedores.store');
    Route::put('/admin/fornecedores/{id}', [AdminController::class, 'updateFornecedor'])->name('admin.fornecedores.update');
    Route::delete('/admin/fornecedores/{id}', [AdminController::class, 'destroyFornecedor'])->name('admin.fornecedores.destroy');

    // Cotações
    Route::post('/admin/cotacoes', [AdminController::class, 'storeCotacao'])->name('admin.cotacoes.store');
    Route::put('/admin/cotacoes/{id}', [AdminController::class, 'updateCotacao'])->name('admin.cotacoes.update');
    Route::delete('/admin/cotacoes/{id}', [AdminController::class, 'destroyCotacao'])->name('admin.cotacoes.destroy');
    
    // Debug test endpoint for quotations
    Route::post('/admin/test-cotacoes', [AdminController::class, 'testQuotation'])->name('admin.cotacoes.test');

});

Route::post('/admin/usuarios-internos', [AdminController::class, 'CriarNovoUsuarioInterno'])->name('admin.criar.usuario-interno');

Route::post('/order-management-store', [OrderManagementController::class, 'store'])->name('OrderManagementStore');

Route::post('/order-management-update-status', [OrderManagementController::class, 'updateStatus'])->name('OrderManagementUpdateStatus');

Route::post('/profile/update', [ProfilleController::class, 'update'])->name('profile.update');


Route::delete('/profile/delete-image', [ProfilleController::class, 'deleteProfileImage'])->name('profile.delete-image');



Route::get('/tags', [TagsController::class, 'tagManagementindex'])->name('tags.index');
Route::post('/tags', [TagsController::class, 'tagManagementStore'])->name('tags.store');
Route::put('/tags/{tag}', [TagsController::class, 'tagManagementUpdate'])->name('tags.update');
Route::delete('/tags/{tag}', [TagsController::class, 'tagManagementDestroy'])->name('tags.destroy');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';




// CONSULTORES - GET


Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('/consultor/client-management', [ConsultorController::class, 'clientsManagament'])->name('consultor-client-management');
    
    Route::get('/consultor/checklist', [ConsultorController::class, 'Checklist'])->name('consultor-checklist');
    
    Route::get('/consultor/agendamentos', [ConsultorController::class, 'Agendamentos'])->name('consultor-agendamentos');
   
    Route::get('/consultor/socialselling', [ConsultorController::class, 'SocialSelling'])->name('consultor-socialSelling');

    Route::get('/consultor/comissoes', [ConsultorController::class, 'comissoes'])->name('consultor-comissoes');

    Route::get('/consultor/crm', [ConsultorController::class, 'CRM'])->name('consultor-crm');

    Route::get('/consultor/registros', [ConsultorController::class, 'Registros'])->name('consultor-registros');

});


//  CONSULTORES - POST
Route::post('/client-management-store', [CrmController::class, 'storeClientManagement'])->name('consultor-client-management-store');

Route::post('/client-management-update', [CrmController::class, 'updateStatus'])->name('consultor-client-management-update');

Route::post('/consultor/client-management-store', [ConsultorController::class, 'storeClientManagementCRM'])->name('consultor-crm-store');

Route::post('/consultor/client-management-update', [ConsultorController::class, 'updateStatusCRM'])->name('consultor-crm-update');


