<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultantDetail extends Model
{
    use HasFactory;

    protected $table = 'consultor_details';

    protected $fillable = [
        'user_id',
        'cpf',
        'instancia',
        'telefone',
        'endereco',
        'categoria',
        'table_supabase',
        'data_nascimento'
    ];

    protected $casts = [
        'data_nascimento' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
