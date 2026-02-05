<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            $table->integer('supabase_cliente_id')->nullable();     // id (int4) do Supabase
            $table->string('supabase_session_id')->nullable();      // session_id (varchar)

            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('status', ['open', 'done'])->default('open');
            $table->enum('importance', ['low', 'medium', 'high'])->default('medium');

            // Responsável (User da sua aplicação)
            $table->foreignId('assignee_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // O front usa <input type="date"> — manter como DATE
            $table->date('due_date')->nullable();

            $table->timestamps();

            // Índices práticos de consulta
            $table->index(['status', 'importance']);
            $table->index('due_date');
            $table->index('assignee_id');

            // Índices de referência externa
            $table->index('supabase_cliente_id');
            $table->index('supabase_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
