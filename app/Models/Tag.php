<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $table = 'tags';

    protected $fillable = [
        'name',
        'color',
        'usage_count'
    ];

    protected $attributes = [
        'usage_count' => 0,
    ];

    protected $casts = [
        'usage_count' => 'integer',
    ];
}
