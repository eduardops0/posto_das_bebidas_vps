<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('meta_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meta_id');
            $table->unsignedBigInteger('consultant_id');
            $table->unsignedBigInteger('product_id'); // Agora obrigatório
            $table->decimal('sale_value', 15, 2); // Valor do produto específico
            $table->decimal('quantity', 8, 2)->default(1); // Quantidade vendida
            $table->unsignedBigInteger('conversion_id')->nullable();
            $table->decimal('total_sale_value', 15, 2); // Valor total da venda (todos os produtos)
            $table->timestamps();

            // Indexes for performance
            $table->index(['meta_id', 'consultant_id']);
            $table->index(['meta_id', 'product_id']);
            $table->index(['conversion_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meta_progress');
    }
};
