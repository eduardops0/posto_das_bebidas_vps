<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class GerenciadorDePlanilhasController extends Controller
{
    public function index()
    {
        // Fetch planilhas from Supabase
        $planilhasUrl = env('SUPABASE_URL') . '/rest/v1/planilhas_cotacoes_posto_das_bebidas';
        $planilhasResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($planilhasUrl, [
            'select' => 'id,nome,descricao,total_registros,created_at',
            'order' => 'created_at.desc'
        ]);

        $planilhas = $planilhasResponse->json() ?? [];

        // Process planilhas to match frontend interface
        $formattedPlanilhas = collect($planilhas)->map(function ($planilha) {
            return [
                'id' => $planilha['id'],
                'nome' => $planilha['nome'] ?? '',
                'descricao' => $planilha['descricao'] ?? '',
                'total_registros' => (int) ($planilha['total_registros'] ?? 0),
                'criado_em' => $planilha['created_at'] ?? now()->toDateString(),
            ];
        })->toArray();

        return Inertia::render('admin/GerenciadorDePlanilhas', [
            'planilhas' => $formattedPlanilhas
        ]);
    }

   public function show($id)
{
    // Fetch specific planilha
    $planilhaUrl = env('SUPABASE_URL') . '/rest/v1/planilhas_cotacoes_posto_das_bebidas?id=eq.' . $id;
    $planilhaResponse = Http::withHeaders([
        'apikey' => env('SUPABASE_SERVICE_ROLE'),
        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
    ])->get($planilhaUrl);

    $planilha = $planilhaResponse->json()[0] ?? null;

    if (!$planilha) {
        abort(404, 'Planilha não encontrada');
    }

    // Fetch cotacoes for this planilha
    $cotacoesUrl = env('SUPABASE_URL') . '/rest/v1/cotacoes_fornecedores_posto_das_bebidas?id_planilha=eq.' . $id;
    $cotacoesResponse = Http::withHeaders([
        'apikey' => env('SUPABASE_SERVICE_ROLE'),
        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
    ])->get($cotacoesUrl, [
        'order' => 'data_envio.desc'
    ]);

    $cotacoes = $cotacoesResponse->json() ?? [];

    // Process cotacoes to match frontend interface
    $formattedCotacoes = collect($cotacoes)->map(function ($cotacao) {
        return [
            'id' => $cotacao['id'],
            'fornecedor' => $cotacao['fornecedor'] ?? '',
            'produto' => $cotacao['produto'] ?? '',
            'quantidade' => $cotacao['quantidade'] ?? '',
            'preco' => (float) ($cotacao['preco'] ?? 0),
            'data_envio' => $cotacao['data_envio'] ?? '',
            'data_referencia' => $cotacao['data_referencia'] ?? '',
            'arquivo_origem' => $cotacao['arquivo_origem'] ?? '',
            'criado_por' => $cotacao['criado_por'] ?? '',
            'status' => $cotacao['status'] ?? 'enabled', // ✅ NOVO (default)
        ];
    })->toArray();

    return Inertia::render('admin/VisualizarPlanilha', [
        'planilha' => [
            'id' => $planilha['id'],
            'nome' => $planilha['nome'] ?? '',
            'descricao' => $planilha['descricao'] ?? '',
            'total_registros' => (int) ($planilha['total_registros'] ?? 0),
            'criado_em' => $planilha['created_at'] ?? now()->toDateString(),
        ],
        'cotacoes' => $formattedCotacoes
    ]);
}


public function disableCotacao(Request $request, $planilhaId, $cotacaoId)
{
    $supabaseUrl = rtrim(env('SUPABASE_URL'), '/');
    $serviceRole = env('SUPABASE_SERVICE_ROLE');

    if (!$supabaseUrl || !$serviceRole) {
        abort(500, 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE não configurados');
    }

    $headers = [
        'apikey'        => $serviceRole,
        'Authorization' => 'Bearer ' . $serviceRole,
        'Accept'        => 'application/json',
        'Content-Type'  => 'application/json',
    ];

    // ✅ 1) Garante que a cotação existe e já valida vínculo com a planilha
    // (fazemos o filtro por id E id_planilha no próprio Supabase)
    $checkUrl = $supabaseUrl
        . '/rest/v1/cotacoes_fornecedores_posto_das_bebidas'
        . '?select=id,id_planilha,status'
        . '&id=eq.' . (int)$cotacaoId
        . '&id_planilha=eq.' . (int)$planilhaId
        . '&limit=1';

    $checkResp = Http::withHeaders($headers)->get($checkUrl);

    \Log::info('disableCotacao.check', [
        'planilhaId'   => (string)$planilhaId,
        'cotacaoId'    => (string)$cotacaoId,
        'check_url'    => $checkUrl,
        'check_status' => $checkResp->status(),
        'check_body'   => $checkResp->json(),
    ]);

    if (!$checkResp->successful()) {
        abort(502, 'Falha ao consultar cotação no Supabase');
    }

    $row = $checkResp->json()[0] ?? null;

    // ✅ Se não veio nada, ou não existe, ou não pertence à planilha
    if (!$row) {
        abort(404, 'Cotação não encontrada para esta planilha');
    }

    // ✅ 2) Atualiza com filtro duplo (id + id_planilha) — à prova de erro
    $updateUrl = $supabaseUrl
        . '/rest/v1/cotacoes_fornecedores_posto_das_bebidas'
        . '?id=eq.' . (int)$cotacaoId
        . '&id_planilha=eq.' . (int)$planilhaId;

    $resp = Http::withHeaders(array_merge($headers, [
        'Prefer' => 'return=representation',
    ]))->patch($updateUrl, [
        'status' => 'disabled',
    ]);

    \Log::info('disableCotacao.update', [
        'update_url'    => $updateUrl,
        'update_status' => $resp->status(),
        'update_body'   => $resp->json(),
    ]);

    if (!$resp->successful()) {
        abort(422, 'Falha ao desativar a cotação no Supabase');
    }

    // ✅ 3) Se por algum motivo não retornou representação, garante que ao menos 1 linha foi afetada
    // (quando return=representation vem vazio, pode ser config/Prefer ignorado)
    $updated = $resp->json();
    if (!is_array($updated) || count($updated) < 1) {
        // Reconfirma se status virou disabled
        $confirmUrl = $supabaseUrl
            . '/rest/v1/cotacoes_fornecedores_posto_das_bebidas'
            . '?select=id,status'
            . '&id=eq.' . (int)$cotacaoId
            . '&id_planilha=eq.' . (int)$planilhaId
            . '&limit=1';

        $confirmResp = Http::withHeaders($headers)->get($confirmUrl);

        \Log::info('disableCotacao.confirm', [
            'confirm_url'    => $confirmUrl,
            'confirm_status' => $confirmResp->status(),
            'confirm_body'   => $confirmResp->json(),
        ]);

        if (!$confirmResp->successful()) {
            abort(502, 'Falha ao confirmar atualização no Supabase');
        }

        $confirmRow = $confirmResp->json()[0] ?? null;
        if (!$confirmRow || (($confirmRow['status'] ?? null) !== 'disabled')) {
            abort(422, 'Não foi possível confirmar a desativação da cotação');
        }
    }

    // ✅ Inertia: redirect back (303)
    return redirect()->back(303)->with('success', 'Cotação desativada com sucesso');
}


}