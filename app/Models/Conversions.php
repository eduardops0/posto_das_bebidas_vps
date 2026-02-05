<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversions extends Model
{
    use HasFactory;

    protected $table = 'conversions';

    protected $fillable = [
        'user_id',
        'client_id',
        'data',
        'nomeCliente',
        'produto',
        'quantidade',
        'valorTotal',
        'status',
        'origem',
        'created_at',
        'updated_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
