<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Planilha extends Model
{
    use HasFactory;

    protected $table = 'planilhas_cotacoes_posto_das_bebidas';

    protected $fillable = [
        'nome',
        'descricao',
        'total_registros',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'total_registros' => 'integer',
    ];

    public function cotacoes(): HasMany
    {
        return $this->hasMany(Cotacao::class, 'id_planilha');
    }
}