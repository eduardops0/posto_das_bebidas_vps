<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_user_id')->constrained('users')->onDelete('cascade');
            $table->date('data');
            $table->string('nome');
            $table->string('razao_social')->nullable();
            $table->string('cnpj')->nullable();
            $table->string('responsavel')->nullable();
            $table->decimal('valor', 10, 2);
            $table->string('servico')->nullable();
            $table->text('descricao')->nullable();
            $table->enum('tipo', ['Entrada', 'Saída']);
            $table->enum('status', ['Confirmado', 'Pendente', 'Cancelado'])->default('Pendente');
            $table->string('metodoPagamento')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
