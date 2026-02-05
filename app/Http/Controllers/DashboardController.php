<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\User;

class DashboardController extends Controller
{
    /**
     * Mapeamento de empresas para seus dados específicos
     * IMPORTANTE: Este controller é específico para Gioppo & Conti
     * Para novas empresas, crie controllers separados
     */
    private function getEmpresaData($empresa)
    {
        // Este controller é específico para gioppo_e_conti
        // Se chamada por outra empresa, retorna dados padrão
        if ($empresa !== 'gioppo_e_conti') {
            return [
                'companyName' => 'Empresa',
                'customTheme' => 'default-theme',
                'features' => []
            ];
        }
        
        return [
            'companyName' => 'Gioppo & Conti',
            'customTheme' => 'gioppo-theme',
            'features' => [
                'aiDashboard' => true,
                'consultorMetrics' => true,
                'funnelAnalysis' => true,
                'weeklyReports' => true
            ]
        ];
    }

    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $selectedConsultant = $request->query('consultant');

        // Buscar dados do Supabase para leads
        $urlLeads = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

        $paramsLeads = ['select' => '*'];
        if ($dateFrom) {
            $paramsLeads['created_at'] = 'gte.' . $dateFrom;
        }
        if ($dateTo) {
            $paramsLeads['created_at'] = isset($paramsLeads['created_at'])
                ? $paramsLeads['created_at'] . ',lte.' . $dateTo
                : 'lte.' . $dateTo;
        }

        $responseLeads = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($urlLeads, $paramsLeads);

        // Buscar dados do Supabase para conversões
        $urlConversoes = env('SUPABASE_URL') . '/rest/v1/registros_posto_das_bebidas';

        $paramsConversoes = ['select' => '*'];
        if ($dateFrom) {
            $paramsConversoes['created_at'] = 'gte.' . $dateFrom;
        }
        if ($dateTo) {
            $paramsConversoes['created_at'] = isset($paramsConversoes['created_at'])
                ? $paramsConversoes['created_at'] . ',lte.' . $dateTo
                : 'lte.' . $dateTo;
        }

        $responseConversoes = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($urlConversoes, $paramsConversoes);

        // Processar resposta para leads
        $dataLeads = [];
        if ($responseLeads->successful()) {
            $dataLeads = $responseLeads->json() ?? [];
        }

        // Processar resposta para conversões
        $dataConversoes = [];
        if ($responseConversoes->successful()) {
            $dataConversoes = $responseConversoes->json() ?? [];
        }

        // Calcular valor total vendido
        $totalValorVendido = array_sum(array_map(function ($item) {
            return (float) ($item['valor_total'] ?? 0);
        }, $dataConversoes));

        // ============================================
        // ✅ CORREÇÃO DO TEMPO MÉDIO DE PEDIDO (AGORA FUNCIONA)
        // ============================================
        $tempoMedioAgendamento = "0h 0min";

        if (!empty($dataConversoes) && !empty($dataLeads)) {
            $diffs = [];

            foreach ($dataConversoes as $conv) {
                // Encontrar o lead pelo session_id
                $lead = collect($dataLeads)->firstWhere('session_id', $conv['session_id']);

                if ($lead) {
                    // strtotime retorna segundos (não milissegundos)
                    $diffSeconds = strtotime($conv['created_at']) - strtotime($lead['created_at']);

                    if ($diffSeconds > 0) {
                        $diffs[] = $diffSeconds;
                    }
                }
            }

            if (!empty($diffs)) {
                $avgSeconds = array_sum($diffs) / count($diffs);

                $hours   = floor($avgSeconds / 3600);
                $minutes = floor(($avgSeconds % 3600) / 60);

                $tempoMedioAgendamento = "{$hours}h {$minutes}min";
            }
        }

        // ============================================
        // FETCH CONSULTANTS AND CALCULATE AVERAGE RESPONSE TIMES
        // ============================================
        $consultants = User::where('role', 'consultor')->get();
        $consultantMetrics = [];

        foreach ($consultants as $consultant) {
            // Skip if filtering by specific consultant and this is not the selected one
            if ($selectedConsultant && $consultant->name !== $selectedConsultant) {
                continue;
            }
            // Query Supabase for records where consultor_nome matches this consultant's name
            $urlConsultant = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';
            $paramsConsultant = [
                'select'        => 'horario_transferido,consultor_respondeu_horario,consultor_nome',
                'consultor_nome'=> 'eq.' . $consultant->name,
            ];

            // Apply date filters if present
            if ($dateFrom) {
                $paramsConsultant['created_at'] = 'gte.' . $dateFrom;
            }
            if ($dateTo) {
                $paramsConsultant['created_at'] = isset($paramsConsultant['created_at'])
                    ? $paramsConsultant['created_at'] . ',lte.' . $dateTo
                    : 'lte.' . $dateTo;
            }

            $responseConsultant = Http::withHeaders([
                'apikey'        => env('SUPABASE_SERVICE_ROLE'),
                'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            ])->get($urlConsultant, $paramsConsultant);

            $consultantData = [];
            if ($responseConsultant->successful()) {
                $consultantData = $responseConsultant->json() ?? [];
            }

            // Calculate average response time
            $responseTimes = [];
            foreach ($consultantData as $record) {
                $transferido = $record['horario_transferido'] ?? null;
                $respondeu   = $record['consultor_respondeu_horario'] ?? null;

                if ($transferido && $respondeu) {
                    $diff = strtotime($respondeu) - strtotime($transferido);
                    if ($diff > 0) {
                        $responseTimes[] = $diff; // in seconds
                    }
                } elseif ($transferido && !$respondeu) {
                    // If null, consider as 0
                    $responseTimes[] = 0;
                }
            }

            $avgResponseTime = 0;
            if (!empty($responseTimes)) {
                $avgResponseTime = array_sum($responseTimes) / count($responseTimes);
            }

            // Convert to minutes for display
            $avgMinutes = round($avgResponseTime / 60);

            $consultantMetrics[] = [
                'nome'               => $consultant->name,
                'tempoMedioResposta' => $avgMinutes . ' min',
                'leadsAtendidos'     => count($consultantData), // Assuming this is the count
                'conversoes'         => 0, // Placeholder, can be calculated if needed
            ];
        }

        return Inertia::render("Dashboard", [
            'authUser'              => $user,
            'dataLeads'             => $dataLeads,
            'dataConversoes'        => $dataConversoes,
            'totalValorVendido'     => $totalValorVendido,
            'tempoMedioAgendamento' => $tempoMedioAgendamento,
            'consultantMetrics'     => $consultantMetrics,
            'consultants'           => $consultants,
            'selectedConsultant'    => $selectedConsultant
        ]);
    }
}
