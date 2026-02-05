<?php

namespace App\Http\Controllers;

use App\Models\MetaProgress;
use App\Models\Conversion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MetaProgressController extends Controller
{
    /**
     * Registrar progresso quando uma venda é realizada
     * Exemplo: Venda com 3 produtos diferentes
     */
    public function registerSaleProgress(Conversion $conversion, array $saleItems)
    {
        // $saleItems = [
        //     ['product_id' => 1, 'value' => 100.00, 'quantity' => 2],
        //     ['product_id' => 2, 'value' => 200.00, 'quantity' => 1],
        //     ['product_id' => 3, 'value' => 50.00, 'quantity' => 1],
        // ]
        
        $totalSaleValue = collect($saleItems)->sum('value');
        
        foreach ($saleItems as $item) {
            // Verificar se este produto se enquadra em alguma meta ativa
            $applicableGoals = $this->getApplicableGoals($conversion->consultant_id, $item['product_id']);
            
            foreach ($applicableGoals as $goal) {
                MetaProgress::create([
                    'meta_id' => $goal->id,
                    'consultant_id' => $conversion->consultant_id,
                    'product_id' => $item['product_id'],
                    'sale_value' => $item['value'],
                    'quantity' => $item['quantity'],
                    'total_sale_value' => $totalSaleValue,
                    'conversion_id' => $conversion->id
                ]);
            }
        }
    }
    
    /**
     * Buscar metas aplicáveis para um consultor e produto
     */
    private function getApplicableGoals($consultantId, $productId)
    {
        // Lógica para buscar metas onde:
        // - Consultant está no array consultants
        // - Product está no array products  
        // - Data da venda está entre start_date e end_date
        // - Status está ativo
        
        // Exemplo de query (ajuste conforme sua estrutura):
        return DB::table('metas')
            ->whereJsonContains('consultants', [$consultantId])
            ->whereJsonContains('products', [$productId])
            ->where('status', 'ativa')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get();
    }
    
    /**
     * Calcular progresso de uma meta
     */
    public function calculateGoalProgress($metaId)
    {
        $totalProgress = MetaProgress::where('meta_id', $metaId)
            ->sum('sale_value');
            
        $goal = DB::table('metas')->find($metaId);
        $targetValue = $goal->target_value;
        
        $progressPercentage = ($totalProgress / $targetValue) * 100;
        
        return [
            'total_progress' => $totalProgress,
            'target_value' => $targetValue,
            'progress_percentage' => round($progressPercentage, 2),
            'is_complete' => $totalProgress >= $targetValue
        ];
    }
    
    /**
     * Calcular comissão baseada no progresso
     */
    public function calculateCommission($metaId, $consultantId)
    {
        $goalProgress = $this->calculateGoalProgress($metaId);
        $goal = DB::table('metas')->find($metaId);
        
        if ($goalProgress['is_complete']) {
            if ($goal->type === 'porcentagem') {
                return ($goalProgress['progress_percentage'] / 100) * $goal->commission_value;
            } else {
                return $goal->commission_value; // bonus_fixo
            }
        }
        
        return 0; // Meta não foi atingida
    }
}
