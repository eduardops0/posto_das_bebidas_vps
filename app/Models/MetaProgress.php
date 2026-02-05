<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetaProgress extends Model
{
    protected $fillable = [
        'meta_id',
        'consultant_id', 
        'product_id',
        'sale_value',
        'quantity',
        'conversion_id',
        'total_sale_value'
    ];

    protected $casts = [
        'sale_value' => 'decimal:2',
        'quantity' => 'decimal:2',
        'total_sale_value' => 'decimal:2',
    ];

    /**
     * Relação com a meta
     */
    public function meta()
    {
        return $this->belongsTo(Meta::class);
    }

    /**
     * Relação com o consultor
     */
    public function consultant()
    {
        return $this->belongsTo(User::class, 'consultant_id');
    }

    /**
     * Relação com o produto
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relação com a conversão/venda
     */
    public function conversion()
    {
        return $this->belongsTo(Conversions::class);
    }

    /**
     * Scope para filtrar por meta
     */
    public function scopeForMeta($query, $metaId)
    {
        return $query->where('meta_id', $metaId);
    }

    /**
     * Scope para filtrar por consultor
     */
    public function scopeForConsultant($query, $consultantId)
    {
        return $query->where('consultant_id', $consultantId);
    }

    /**
     * Scope para filtrar por período
     */
    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
