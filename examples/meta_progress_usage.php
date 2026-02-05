<?php

// Exemplo de como usar o sistema de progresso de metas

use App\Http\Controllers\MetaProgressController;
use App\Models\Conversions;

// Quando uma venda é registrada no sistema:
class VendaController extends Controller
{
    public function storeVenda(Request $request)
    {
        // Dados da venda com múltiplos produtos
        $vendaData = [
            'consultant_id' => 123,
            'products' => [
                ['product_id' => 1, 'value' => 100.00, 'quantity' => 2],
                ['product_id' => 2, 'value' => 200.00, 'quantity' => 1],
                ['product_id' => 3, 'value' => 50.00, 'quantity' => 1],
            ],
            'total_value' => 450.00, // 100*2 + 200*1 + 50*1
        ];

        // 1. Criar o registro de conversão/venda
        $conversion = Conversions::create([
            'consultant_id' => $vendaData['consultant_id'],
            'value' => $vendaData['total_value'],
            'date' => now(),
            // ... outros campos
        ]);

        // 2. Registrar progresso para cada produto na meta
        $metaController = new MetaProgressController();
        $metaController->registerSaleProgress($conversion, $vendaData['products']);

        // 3. Calcular progresso da meta
        $progress = $metaController->calculateGoalProgress($metaId);
        
        // 4. Calcular comissão se meta foi atingida
        if ($progress['is_complete']) {
            $commission = $metaController->calculateCommission($metaId, $vendaData['consultant_id']);
            // Processar pagamento da comissão
        }

        return response()->json([
            'message' => 'Venda registrada com sucesso',
            'progress' => $progress,
            'commission' => $commission ?? 0
        ]);
    }
}

// Exemplo de consulta para dashboard do consultor:
class DashboardController extends Controller
{
    public function getConsultorProgress()
    {
        $consultantId = auth()->id();
        
        // Progresso por meta
        $metasProgress = DB::table('metas')
            ->leftJoin('meta_progress', 'metas.id', '=', 'meta_progress.meta_id')
            ->whereJsonContains('metas.consultants', [$consultantId])
            ->where('metas.status', 'ativa')
            ->selectRaw('
                metas.id,
                metas.name,
                metas.target_value,
                metas.commission_value,
                metas.type,
                COALESCE(SUM(meta_progress.sale_value), 0) as current_progress,
                (COALESCE(SUM(meta_progress.sale_value), 0) / metas.target_value * 100) as progress_percentage
            ')
            ->groupBy('metas.id', 'metas.name', 'metas.target_value', 'metas.commission_value', 'metas.type')
            ->get();

        return view('consultor.dashboard', compact('metasProgress'));
    }
}

// Exemplo de consulta para relatório de progresso:
class RelatorioController extends Controller
{
    public function getProgressReport($metaId, $startDate, $endDate)
    {
        $progress = DB::table('meta_progress')
            ->join('conversions', 'meta_progress.conversion_id', '=', 'conversions.id')
            ->join('users', 'meta_progress.consultant_id', '=', 'users.id')
            ->join('products', 'meta_progress.product_id', '=', 'products.id')
            ->where('meta_progress.meta_id', $metaId)
            ->whereBetween('meta_progress.created_at', [$startDate, $endDate])
            ->selectRaw('
                users.name as consultant_name,
                products.name as product_name,
                SUM(meta_progress.sale_value) as total_sales,
                SUM(meta_progress.quantity) as total_quantity,
                COUNT(DISTINCT meta_progress.conversion_id) as total_conversions
            ')
            ->groupBy('users.name', 'products.name')
            ->get();

        return response()->json($progress);
    }
}
