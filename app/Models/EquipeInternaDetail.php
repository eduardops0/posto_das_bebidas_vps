<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipeInternaDetail extends Model
{
    use HasFactory;

    protected $table = 'equipe_interna_details';

    protected $fillable = [
        'user_id',
        'cpf',
        'telefone',
        'endereco',
        'categoria',
        'nome_completo',
        'data_nascimento',
        'profile_image'
    ];

    protected $casts = [
        'data_nascimento' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
