<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients_details')->onDelete('cascade');
            $table->date('data');
            $table->string('nomeCliente');
            $table->string('produto');
            $table->integer('quantidade')->default(1);
            $table->decimal('valorTotal', 10, 2);
            $table->enum('status', ['Concluída', 'Pendente', 'Cancelada'])->default('Pendente');
            $table->string('origem')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversions');
    }
};
