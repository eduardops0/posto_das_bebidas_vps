<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientDetail extends Model
{
    use HasFactory;

    protected $table = 'clients_details';

    protected $fillable = [
        'user_id',
        'razao_social',
        'cnpj',
        'nome_completo_socio',
        'cpf_socio',
        'instancia',
        'telefone',
        'endereco',
        'responsavel',
        'data_inicio',
        'vencimento_do_contrato',
        'valor_setup',
        'setup_pago',
        'setup_status',
        'valor_mensalidade',
        'data_mensalidade',
        'mensalidade_status',
        'workflow_link',
        'descricao_do_servico',
        'data_aniversario',
        'canal_de_aquisicao',
        'table_supabase',
        'profile_image',
        'historico',
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'vencimento_do_contrato' => 'date',
        'data_mensalidade' => 'date',
        'data_aniversario' => 'date',
        'valor_setup' => 'decimal:2',
        'valor_mensalidade' => 'decimal:2',
        'setup_pago' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
