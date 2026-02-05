<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('razao_social')->nullable();
            $table->string('cnpj')->nullable();
            $table->string('nome_completo_socio')->nullable();
            $table->string('cpf_socio')->nullable();
            $table->string('instancia')->nullable();
            $table->string('telefone')->nullable();
            $table->string('endereco')->nullable();
            $table->string('responsavel')->nullable();
            $table->date('data_inicio')->nullable();
            $table->date('vencimento_do_contrato')->nullable();
            $table->decimal('valor_setup', 10, 2)->default(0);
            $table->boolean('setup_pago')->default(false);
            $table->enum('setup_status', ['Pendente', 'Pago', 'Cancelado'])->default('Pendente');
            $table->decimal('valor_mensalidade', 10, 2)->default(0);
            $table->date('data_mensalidade')->nullable();
            $table->enum('mensalidade_status', ['Em dia', 'Atrasado', 'Cancelado'])->default('Em dia');
            $table->string('workflow_link')->nullable();
            $table->text('descricao_do_servico')->nullable();
            $table->date('data_aniversario')->nullable();
            $table->string('canal_de_aquisicao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients_details');
    }
};
