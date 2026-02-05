<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $table = 'tasks';

    protected $fillable = [
        // Referências Supabase / compat front
        'supabase_cliente_id',
        'supabase_session_id',

        // Campos da tarefa
        'title',
        'description',
        'status',
        'importance',
        'assignee_id',
        'due_date',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
