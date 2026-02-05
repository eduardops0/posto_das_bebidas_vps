<?php

namespace App\Http\Controllers\Consultor;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Tag;
use App\Models\MetaProgress;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;
use App\Http\Controllers\RegistrosController;
use App\Http\Controllers\Controller;

class ConsultorController extends Controller
{
    public function Dashboard(Request $request)
{
    $user = Auth::user();
    $consultantId = $user->id;
    $dateFrom = $request->query('date_from');
    $dateTo = $request->query('date_to');
    $selectedConsultant = $request->query('consultant');

    // ------------------------------------------------------------
    // ✅ Header padrão Supabase (mantém seu padrão "busque normal")
    // ------------------------------------------------------------
    $supabaseHeaders = [
        'apikey'        => env('SUPABASE_SERVICE_ROLE'),
        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
    ];

    /**
     * ✅ Helper pra fazer GET no Supabase REST e permitir created_at duplicado (gte/lte)
     * Mantém o mesmo estilo do seu código (Http::get), mas corrige o caso de data.
     */
    $supabaseGet = function (string $url, array $params = [], ?string $dateFrom = null, ?string $dateTo = null) use ($supabaseHeaders) {
        // Query base
        $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

        // created_at precisa ser enviado em DOIS params separados no Supabase
        if ($dateFrom) {
            $query .= ($query ? '&' : '') . 'created_at=' . urlencode('gte.' . $dateFrom);
        }
        if ($dateTo) {
            $query .= ($query ? '&' : '') . 'created_at=' . urlencode('lte.' . $dateTo);
        }

        $finalUrl = $url . ($query ? ('?' . $query) : '');

        return Http::withHeaders($supabaseHeaders)->get($finalUrl);
    };

    // Buscar dados do Supabase para leads filtrados por consultor_id
    $urlLeads = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

    $paramsLeads = ['select' => '*', 'consultor_id' => 'eq.' . $consultantId];

    // ✅ Agora o filtro de data funciona corretamente (gte/lte separados)
    $responseLeads = $supabaseGet($urlLeads, $paramsLeads, $dateFrom, $dateTo);

    // Buscar dados do Supabase para conversões filtradas por consultor_id
    $urlConversoes = env('SUPABASE_URL') . '/rest/v1/registros_posto_das_bebidas';

    $paramsConversoes = ['select' => '*', 'consultor_id' => 'eq.' . $consultantId];

    // ✅ Agora o filtro de data funciona corretamente (gte/lte separados)
    $responseConversoes = $supabaseGet($urlConversoes, $paramsConversoes, $dateFrom, $dateTo);

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
    // FETCH TIME GOALS
    // ============================================
    $goalsUrl = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas';
    $goalsResponse = Http::withHeaders($supabaseHeaders)->get($goalsUrl, [
        'type' => 'eq.time',
        'status' => 'eq.active',
    ]);

    $timeGoals = [];
    if ($goalsResponse->successful()) {
        $goalsRaw = $goalsResponse->json() ?? [];
        $now = now();
        foreach ($goalsRaw as $goal) {
            $start = Carbon::parse($goal['start_date']);
            $end = Carbon::parse($goal['end_date']);
            if ($now->between($start, $end)) {
                $timeGoals[] = $goal;
            }
        }
    }

    // ============================================
    // FETCH GENERAL GOALS AND PROGRESS
    // ============================================
    $generalGoalsUrl = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas';
    $generalGoalsResponse = Http::withHeaders($supabaseHeaders)->get($generalGoalsUrl, [
        'status' => 'eq.active',
    ]);

    $userGoals = [];
    if ($generalGoalsResponse->successful()) {
        $goalsRaw = $generalGoalsResponse->json() ?? [];
        $now = now();

        // ------------------------------------------------------------
        // ✅ 1) Filtra metas válidas do consultor (igual seu código)
        // ------------------------------------------------------------
        $validGoals = [];
        $metaPeriods = []; // meta_id => ['start' => Carbon, 'end' => Carbon]

        foreach ($goalsRaw as $goal) {
            $consultants = $goal['consultants'] ?? [];
            if (is_string($consultants)) {
                $consultants = json_decode($consultants, true) ?? [];
            }
            if (!is_array($consultants) || !in_array($consultantId, $consultants)) {
                continue;
            }

            // Mantém sua regra de data (mas garantindo range do dia inteiro)
            $start = Carbon::parse($goal['start_date'])->startOfDay();
            $end   = Carbon::parse($goal['end_date'])->endOfDay();

            if (!$now->between($start, $end)) {
                continue;
            }

            $validGoals[] = $goal;
            $metaId = (int) ($goal['id'] ?? 0);
            if ($metaId > 0) {
                $metaPeriods[$metaId] = ['start' => $start, 'end' => $end];
            }
        }

        // ------------------------------------------------------------
        // ✅ 2) Busca progresso no SUPABASE (tabela meta_progress_posto_das_bebidas)
        //     e soma total_sale_value por meta_id
        // ------------------------------------------------------------
        $progressByMeta = [];

        if (!empty($validGoals)) {
            // Range único (min start / max end) pra buscar tudo em 1 request
            $minStart = null;
            $maxEnd = null;

            foreach ($validGoals as $g) {
                $s = Carbon::parse($g['start_date'])->startOfDay();
                $e = Carbon::parse($g['end_date'])->endOfDay();
                $minStart = $minStart ? $minStart->min($s) : $s;
                $maxEnd   = $maxEnd ? $maxEnd->max($e) : $e;
            }

            $progressUrl = env('SUPABASE_URL') . '/rest/v1/meta_progress_posto_das_bebidas';

            // Busca as linhas e soma no PHP (modo "normal" REST)
            $progressParams = [
                'select' => 'meta_id,total_sale_value,created_at',
                'consultant_id' => 'eq.' . $consultantId,
            ];

            $progressResponse = $supabaseGet(
                $progressUrl,
                $progressParams,
                $minStart ? $minStart->toIso8601String() : null,
                $maxEnd ? $maxEnd->toIso8601String() : null
            );

            $progressRows = $progressResponse->successful()
                ? ($progressResponse->json() ?? [])
                : [];

            foreach ($progressRows as $row) {
                $metaId = (int) ($row['meta_id'] ?? 0);
                if ($metaId <= 0) {
                    continue;
                }

                // Garante que a soma respeite o período da meta específica
                if (!isset($metaPeriods[$metaId])) {
                    continue;
                }

                $rowCreatedAt = isset($row['created_at']) ? Carbon::parse($row['created_at']) : null;
                if (!$rowCreatedAt) {
                    continue;
                }

                $start = $metaPeriods[$metaId]['start'];
                $end   = $metaPeriods[$metaId]['end'];

                if (!$rowCreatedAt->between($start, $end)) {
                    continue;
                }

                $val = (float) ($row['total_sale_value'] ?? 0);
                $progressByMeta[$metaId] = ($progressByMeta[$metaId] ?? 0) + $val;
            }
        }

        // ------------------------------------------------------------
        // ✅ 3) Monta userGoals (mantendo exatamente seu payload)
        // ------------------------------------------------------------
        foreach ($validGoals as $goal) {
            $goalId = (int) ($goal['id'] ?? 0);
            $totalProgress = (float) ($progressByMeta[$goalId] ?? 0);

            $targetValue = (float) ($goal['target_value'] ?? 0);
            $progressPercentage = $targetValue > 0 ? ($totalProgress / $targetValue) * 100 : 0;
            $achieved = $totalProgress >= $targetValue;

            $userGoals[] = [
                'id' => $goal['id'],
                'type' => $goal['type'],
                'target_value' => $targetValue,
                'commission_value' => (float) ($goal['commission_value'] ?? 0),
                'products' => $goal['products'] ?? [],
                'start_date' => $goal['start_date'],
                'end_date' => $goal['end_date'],
                'status' => $goal['status'],
                'total_progress' => $totalProgress,
                'progress_percentage' => round($progressPercentage, 2),
                'achieved' => $achieved,
            ];
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

        // Query Supabase for records where consultor_id matches this consultant's id
        $urlConsultant = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';
        $paramsConsultant = [
            'select'        => 'horario_transferido,consultor_respondeu_horario',
            'consultor_id'  => 'eq.' . $consultant->id,
        ];

        // ✅ Agora o filtro de data funciona corretamente (gte/lte separados)
        $responseConsultant = $supabaseGet($urlConsultant, $paramsConsultant, $dateFrom, $dateTo);

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

        // Check time goals achievement for this consultant
        $achievedGoals = [];
        foreach ($timeGoals as $goal) {
            $targetSeconds = $goal['target_value'] * 60; // target_value is in minutes
            $achieved = $avgResponseTime <= $targetSeconds;
            $achievedGoals[] = [
                'goal_id' => $goal['id'],
                'target_minutes' => $goal['target_value'],
                'commission' => $goal['commission_value'],
                'achieved' => $achieved,
                'avg_response_minutes' => $avgMinutes,
            ];
        }

        $consultantMetrics[] = [
            'nome'               => $consultant->name,
            'tempoMedioResposta' => $avgMinutes . ' min',
            'leadsAtendidos'     => count($consultantData), // Assuming this is the count
            'conversoes'         => 0, // Placeholder, can be calculated if needed
            'timeGoals'          => $achievedGoals,
        ];
    }

    // Get current user's time goals achievement
    $currentUserMetric = collect($consultantMetrics)->firstWhere('nome', $user->name);
    $userTimeGoals = $currentUserMetric['timeGoals'] ?? [];

    return Inertia::render("consultor/Dashboard", [
        'authUser'              => $user,
        'dataLeads'             => $dataLeads,
        'dataConversoes'        => $dataConversoes,
        'totalValorVendido'     => $totalValorVendido,
        'tempoMedioAgendamento' => $tempoMedioAgendamento,
        'consultantMetrics'     => $consultantMetrics,
        'consultants'           => $consultants,
        'selectedConsultant'    => $selectedConsultant,
        'userTimeGoals'         => $userTimeGoals,
        'timeGoals'             => $timeGoals, // all active time goals for display
        'userGoals'             => $userGoals,
    ]);
}



    public function tagManagement() {
        $user = Auth::user();
        $tags = Tag::orderBy('created_at', 'desc')->get();

        return Inertia::render('consultor/TagManager',[
            'authUser' => $user
        ]);
    }

    public function tagManagementindex()
    {
        $tags = Tag::orderBy('created_at', 'desc')->get();

        return response()->json(['tags' => $tags]);
    }

    public function tagManagementStore(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|string|max:7',
        ]);

        $tag = Tag::create($validated);

        return response()->json($tag);
    }

    public function tagManagementUpdate(Request $request, Tag $tag)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|string|max:7',
        ]);

        $tag->update($validated);

        return response()->json($tag);
    }

    public function tagManagementDestroy(Tag $tag)
    {
        $tag->delete();

        return response()->json(['message' => 'Tag deletada com sucesso']);
    }

    public function Registros()
    {
        $user = Auth::user();

        $url = env('SUPABASE_URL') . '/rest/v1/registros_posto_das_bebidas';

        $query = http_build_query([
            'select' => 'id, data, nome_cliente, nome_empresa, valor_total, origem, consultor_id, consultor_nome, created_at',
            'consultor_id' => "eq.{$user->id}",
        ]);

        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get("$url?$query");

        $conversions = collect($response->json() ?? [])->map(function ($item) {
            return [
                'id'              => $item['id'] ?? null,
                'data'            => $item['data'] ?? $item['created_at'] ?? null,
                'nomeCliente'     => $item['nome_cliente'] ?? '',
                'nomeEmpresa'     => $item['nome_empresa'] ?? '',
                'valorTotal'      => (float) ($item['valor_total'] ?? 0),
                'origem'          => $item['origem'] ?? 'Indefinido',
                'consultor_id'    => $item['consultor_id'] ?? null,
                'consultor_nome'  => $item['consultor_nome'] ?? '',
            ];
        });

        return Inertia::render('consultor/Registros', [
            'user'        => $user,
            'conversions' => $conversions,
        ]);
    }

    public function CRM()
    {
        $user = Auth::user();
        $url = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($url, [
            'select' => 'id, nome_cliente, nome_empresa, valor_total, created_at, status, session_id, items, termometro, tags, origem, observacoes, data_follow_up, assunto_follow_up, consultor_id, consultor_nome',
            'consultor_id' => 'eq.' . $user->id,
        ]);

        // Fetch products
        $productsUrl = env('SUPABASE_URL') . '/rest/v1/produtos_posto_das_bebidas';
        $productsResponse = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($productsUrl, [
            'select' => 'produto, preco',
        ]);

        $products = collect($productsResponse->json() ?? [])->map(function ($product) {
            return [
                'produto' => $product['produto'] ?? '',
                'preco' => $product['preco'] ?? '0',
            ];
        });

        // Fetch consultants
        $consultants = User::where('role', 'consultor')->select('id', 'name')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
            ];
        });

        // 1) Normaliza os pedidos vindos do Supabase
        $orders = collect($response->json() ?? [])->map(function ($order) {
            $items = $order['items'] ?? [];

            // Se vier como string JSON, decodifica
            if (is_string($items)) {
                $items = json_decode($items, true) ?? [];
            }

            // Se vier como objeto, transforma em array
            if (!is_array($items)) {
                $items = [];
            }

            $tags = $order['tags'] ?? [];

            if (is_string($tags)) {
                $tags = json_decode($tags, true) ?? [];
            }

            if (!is_array($tags)) {
                $tags = [];
            }

            $allItems = $items;

            // Calculate totalValue from items
            $totalValue = 0;
            foreach ($allItems as $item) {
                $preco = (float) ($item['preco'] ?? 0);
                $quantidade = (float) ($item['quantidade'] ?? 1);
                $totalValue += $preco * $quantidade;
            }

            return [
                'id' => $order['id'],
                'clientName' => $order['nome_cliente'] ?? '',
                'nome_empresa' => $order['nome_empresa'] ?? '',
                'phone' => $order['session_id'] ?? '',
                'totalValue' => $totalValue,
                'items' => $allItems,
                'termometro' => $order['termometro'] ?? '',
                'status' => $order['status'] ?? 'caixa-entrada',
                'createdAt' => $order['created_at'] ?? now()->toISOString(),
                'tags' => $tags,
                'origem' => $order['origem'] ?? '',
                'observacoes' => $order['observacoes'] ?? '',
                'data_follow_up' => $order['data_follow_up'] ?? '',
                'assunto_follow_up' => $order['assunto_follow_up'] ?? '',
                'responsaveis' => [], // será preenchido logo abaixo
                'consultor_id' => $order['consultor_id'] ?? null,
                'consultor_nome' => $order['consultor_nome'] ?? '',
            ];
        });

        return Inertia::render('consultor/CRM', [
            'salesOrders'      => $orders,
            'totalConversions' => 0,
            'products'         => $products,
            'userRole'         => $user->role,
            'consultants'      => $consultants,
        ]);
    }

    public function storeClientManagementCRM(Request $request)
    {
        $data = $request->all();

        $user = auth()->user();
        $url = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

        // Calculate totalValue from items
        $items = $data['items'] ?? [];
        $totalValue = 0;
        foreach ($items as $item) {
            $preco = (float) ($item['preco'] ?? 0);
            $quantidade = (float) ($item['quantidade'] ?? 1);
            $totalValue += $preco * $quantidade;
        }

        // Campos para atualizar no Supabase baseados nos dados do modal
        $updateData = [
            'nome_cliente' => $data['clientName'],
            'nome_empresa' => $data['nome_empresa'] ?? '',
            'valor_total'  => $totalValue,
            'status'       => $data['status'],
            'termometro'   => $data['termometro'],
            'origem'       => $data['origem'],
            'consultor_id' => $data['consultor_id'] ?? $user->id, // set to current user if not set
            'consultor_nome' => $data['consultor_nome'] ?? $user->name,
            'tags'         => json_encode($data['tags'] ?? []),
            'items'        => json_encode($data['items'] ?? []),
            'observacoes'  => $data['observacoes'] ?? '',
            'data_follow_up' => $data['data_follow_up'] ?? null,
            'assunto_follow_up' => $data['assunto_follow_up'] ?? '',
        ];

        // Faz o update filtrando pelo session_id (phone)
        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type'  => 'application/json',
            'Prefer'        => 'return=representation', // retorna dados atualizados
        ])->patch($url . '?session_id=eq.' . $data['phone'], $updateData);

        return response()->json([
            'message'  => 'Pedido atualizado com sucesso',
            'supabase' => $response->json()
        ]);
    }

   public function updateStatusCRM(Request $request)
{
    $phone  = $request->input('phone');
    $status = $request->input('status');
    $order  = $request->input('order') ?? [];

    // se por algum motivo vier como string JSON
    if (is_string($order) && $order !== '') {
        $decoded = json_decode($order, true);
        if (is_array($decoded)) $order = $decoded;
    }

    $url = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

    // Helper: converte valor que pode vir como array OU string JSON em array
    $asArray = function ($value): array {
        if (is_array($value)) return $value;
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return [];
    };

    // Helper: normaliza string (remove \n, múltiplos espaços, trim, lowercase)
    $norm = function ($s): string {
        $s = (string) $s;
        $s = preg_replace('/\s+/', ' ', trim($s));
        return mb_strtolower($s);
    };

    $updateData = [];

    // ✅ SOMENTE NA TRANSIÇÃO para standby
    $previousOrderStatus = $order['status'] ?? null;

    if ($status === 'standby' && $previousOrderStatus !== 'standby') {

        \Log::info('Entrando no bloco standby (TRANSIÇÃO)', [
            'status' => $status,
            'order_status' => $previousOrderStatus,
            'order_id' => ($order['id'] ?? null),
            'items_count' => count($order['items'] ?? []),
        ]);

        // 1) Criar registro em standby
        $registroId = null;

        try {
            $registroController = new RegistrosController();

            $storeResponse = $registroController->store(new Request([
                'nome_cliente'     => $order['clientName'] ?? '',
                'nome_empresa'     => $order['nome_empresa'] ?? '',
                'valor_total'      => $order['totalValue'] ?? 0,
                'origem'           => $order['origem'] ?? 'Indefinido',
                'consultor_id'     => $order['consultor_id'] ?? null,
                'consultor_nome'   => $order['consultor_nome'] ?? '',
            ]));

            /**
             * Extração SUPER robusta do ID do registro criado.
             * Seu log mostrou retorno no formato: [ { "id": 31, ... } ]
             */
            $data = null;

            if ($storeResponse instanceof \Illuminate\Http\JsonResponse) {
                $data = $storeResponse->getData(true);
            } elseif ($storeResponse instanceof \Illuminate\Http\Response) {
                $data = $storeResponse->getOriginalContent();
            } elseif (is_array($storeResponse) || is_object($storeResponse)) {
                $data = $storeResponse;
            }

            // Normaliza Collection -> array
            if ($data instanceof \Illuminate\Support\Collection) {
                $data = $data->toArray();
            }

            // 1) Caso: [ ['id' => 31, ...] ]
            if (is_array($data) && isset($data[0]) && is_array($data[0]) && isset($data[0]['id'])) {
                $registroId = $data[0]['id'];
            }
            // 2) Caso: [ (object) { id: 31 } ]
            elseif (is_array($data) && isset($data[0]) && is_object($data[0]) && isset($data[0]->id)) {
                $registroId = $data[0]->id;
            }
            // 3) Caso: ['id' => 31]
            elseif (is_array($data) && isset($data['id'])) {
                $registroId = $data['id'];
            }
            // 4) Caso: ['data' => [ ['id'=>31] ]]
            elseif (is_array($data) && isset($data['data'][0]['id'])) {
                $registroId = $data['data'][0]['id'];
            }
            // 5) Caso: ['registro' => ['id'=>31]]
            elseif (is_array($data) && isset($data['registro']['id'])) {
                $registroId = $data['registro']['id'];
            }
            // 6) Caso: (object) { id: 31 }
            elseif (is_object($data) && isset($data->id)) {
                $registroId = $data->id;
            }
            // 7) Caso: (object) { data: [ { id: 31 } ] }
            elseif (is_object($data) && isset($data->data) && is_array($data->data) && isset($data->data[0]) && is_object($data->data[0]) && isset($data->data[0]->id)) {
                $registroId = $data->data[0]->id;
            }

            // normaliza
            if ($registroId && is_numeric($registroId)) {
                $registroId = (int) $registroId;
            } else {
                $registroId = null;
            }

            \Log::info('Standby: registro criado', [
                'registro_id' => $registroId,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Erro ao criar registro em standby', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
                'file'  => $e->getFile(),
            ]);
        }

        // 🔥 MARCADOR: se você não ver este log, tem return/erro antes ou arquivo errado em execução
        \Log::info('### MARCADOR META_PROGRESS: CHEGUEI AQUI ###', [
            'consultantId' => ($order['consultor_id'] ?? null),
            'registroId'   => $registroId,
            'order_id'     => ($order['id'] ?? null),
        ]);

        // 2) Verificar metas e inserir no meta_progress
        try {
            $consultantId = $order['consultor_id'] ?? null;

            // ✅ conversion_id PRECISA ser o id do registro gerado
            $conversionId = $registroId;

            \Log::info('Standby: ids', [
                'consultantId' => $consultantId,
                'conversionId' => $conversionId,
            ]);

            if ($consultantId && $conversionId) {

                // 2.1) Buscar produtos
                $productsUrl = env('SUPABASE_URL') . '/rest/v1/produtos_posto_das_bebidas';
                $productsResponse = \Http::withHeaders([
                    'apikey'        => env('SUPABASE_SERVICE_ROLE'),
                    'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
                ])->get($productsUrl, [
                    'select' => 'id, produto, preco',
                ]);

                if (!$productsResponse->successful()) {
                    \Log::error('Standby: erro ao buscar produtos', [
                        'status' => $productsResponse->status(),
                        'body'   => $productsResponse->body(),
                    ]);
                } else {
                    $productsList   = collect($productsResponse->json() ?? []);
                    $productsByName = $productsList->keyBy(fn($p) => $norm($p['produto'] ?? ''));

                    \Log::info('Standby: products fetched', ['count' => $productsList->count()]);

                    // 2.2) Montar itens do pedido indexados por product_id
                    $orderItemsByProductId = [];

                    foreach (($order['items'] ?? []) as $item) {
                        $nameKey = $norm($item['produto'] ?? '');
                        $product = $productsByName->get($nameKey);
                        if (!$product) continue;

                        $productId = (int) ($product['id'] ?? 0);
                        if (!$productId) continue;

                        $priceRaw = (string)($item['preco'] ?? 0);
                        $qtyRaw   = (string)($item['quantidade'] ?? ($item['quantity'] ?? 1));

                        $saleValue = (float) str_replace(',', '.', preg_replace('/[^\d,\.]/', '', $priceRaw));
                        $quantity  = (float) str_replace(',', '.', preg_replace('/[^\d,\.]/', '', $qtyRaw));
                        if ($quantity <= 0) $quantity = 1;

                        // se repetir o mesmo produto, soma quantidade
                        if (!isset($orderItemsByProductId[$productId])) {
                            $orderItemsByProductId[$productId] = [
                                'sale_value' => $saleValue,
                                'quantity'   => $quantity,
                                'produto'    => $product['produto'] ?? ($item['produto'] ?? ''),
                            ];
                        } else {
                            $orderItemsByProductId[$productId]['quantity'] += $quantity;
                        }
                    }

                    \Log::info('Standby: order product ids', ['ids' => array_keys($orderItemsByProductId)]);

                    if (!empty($orderItemsByProductId)) {

                        // 2.3) Buscar metas
                        $metasUrl = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas';
                        $metasResponse = \Http::withHeaders([
                            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
                            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
                        ])->get($metasUrl);

                        if (!$metasResponse->successful()) {
                            \Log::error('Standby: erro ao buscar metas', [
                                'status' => $metasResponse->status(),
                                'body'   => $metasResponse->body(),
                            ]);
                        } else {
                            $allMetas = $metasResponse->json() ?? [];
                            \Log::info('Standby: all metas count', ['count' => count($allMetas)]);

                            // Filtrar metas onde consultants contém consultantId
                            $metas = [];
                            foreach ($allMetas as $meta) {
                                $consultants = $asArray($meta['consultants'] ?? []);

                                // normaliza pra evitar mismatch string/int
                                $consultants = array_map(fn($v) => is_numeric($v) ? (int)$v : $v, $consultants);

                                if (in_array((int)$consultantId, $consultants, true)) {
                                    $metas[] = $meta;
                                }
                            }

                            \Log::info('Standby: filtered metas', ['count' => count($metas)]);

                            // 2.4) Buscar existentes (idempotência) por (conversion_id + consultant_id)
                            $existingUrl = env('SUPABASE_URL') . '/rest/v1/meta_progress_posto_das_bebidas';
                            $existingRes = \Http::withHeaders([
                                'apikey'        => env('SUPABASE_SERVICE_ROLE'),
                                'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
                            ])->get($existingUrl, [
                                'select'        => 'meta_id,product_id',
                                'conversion_id' => 'eq.' . $conversionId,
                                'consultant_id' => 'eq.' . $consultantId,
                            ]);

                            $existingSet = [];
                            if ($existingRes->successful()) {
                                foreach (($existingRes->json() ?? []) as $row) {
                                    $existingSet[($row['meta_id'] ?? '') . ':' . ($row['product_id'] ?? '')] = true;
                                }
                            } else {
                                \Log::warning('Standby: não conseguiu buscar existing progress', [
                                    'status' => $existingRes->status(),
                                    'body'   => $existingRes->body(),
                                ]);
                            }

                            // 2.5) Inserir por overlap de product_id
                            $progressUrl = env('SUPABASE_URL') . '/rest/v1/meta_progress_posto_das_bebidas';

                            foreach ($metas as $meta) {
                                $metaId = $meta['id'] ?? null;
                                if (!$metaId) continue;

                                $metaProducts = $asArray($meta['products'] ?? []);
                                \Log::info('Standby: meta products', [
                                    'metaId' => $metaId,
                                    'count'  => count($metaProducts)
                                ]);

                                foreach ($metaProducts as $pid) {
                                    $pid = (int) $pid;

                                    if (!isset($orderItemsByProductId[$pid])) continue;

                                    $key = $metaId . ':' . $pid;
                                    if (isset($existingSet[$key])) {
                                        // já inserido -> evita duplicar dentro do mesmo conversion_id
                                        continue;
                                    }

                                    $saleValue = (float) $orderItemsByProductId[$pid]['sale_value'];
                                    $quantity  = (float) $orderItemsByProductId[$pid]['quantity'];
                                    $totalSaleValue = $saleValue * $quantity;

                                    \Log::info('Standby: inserting progress', [
                                        'meta_id'           => $metaId,
                                        'consultant_id'     => $consultantId,
                                        'product_id'        => $pid,
                                        'sale_value'        => $saleValue,
                                        'quantity'          => $quantity,
                                        'total_sale_value'  => $totalSaleValue,
                                        'conversion_id'     => $conversionId,
                                    ]);

                                    $insertResponse = \Http::withHeaders([
                                        'apikey'        => env('SUPABASE_SERVICE_ROLE'),
                                        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
                                        'Content-Type'  => 'application/json',
                                        'Prefer'        => 'return=representation',
                                    ])->asJson()->post($progressUrl, [
                                        'meta_id'           => $metaId,
                                        'consultant_id'     => $consultantId,
                                        'product_id'        => $pid,
                                        'sale_value'        => $saleValue,
                                        'quantity'          => $quantity,
                                        'conversion_id'     => $conversionId,
                                        'total_sale_value'  => $totalSaleValue,
                                    ]);

                                    \Log::info('Standby: insert response', [
                                        'status' => $insertResponse->status(),
                                        'body'   => $insertResponse->body(),
                                    ]);

                                    if ($insertResponse->successful()) {
                                        $existingSet[$key] = true;
                                    } else {
                                        \Log::error('Standby: falha ao inserir meta_progress', [
                                            'status' => $insertResponse->status(),
                                            'body'   => $insertResponse->body(),
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                \Log::warning('Standby: sem consultantId ou registroId (conversionId) -> não insere meta_progress', [
                    'consultantId' => $consultantId,
                    'registroId'   => $registroId,
                ]);
            }

        } catch (\Throwable $e) {
            \Log::error('Erro inesperado no bloco de meta_progress', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
                'file'  => $e->getFile(),
            ]);
        }

        // 3) Atualizar pedido para standby, zerar valores e limpar items
        $updateData = [
            'status'      => 'standby',
            'valor_total' => 0,
            'items'       => [],
        ];

    } else {
        $updateData = [
            'status' => $status
        ];
    }

    // 4) PATCH no Supabase (cliente_dados_posto_das_bebidas) pelo session_id
    $response = \Http::withHeaders([
        'apikey'        => env('SUPABASE_SERVICE_ROLE'),
        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        'Content-Type'  => 'application/json',
        'Prefer'        => 'return=representation'
    ])->asJson()->patch($url . '?session_id=eq.' . urlencode((string)$phone), $updateData);

    if (!$response->successful()) {
        \Log::error('Erro ao atualizar status no Supabase', [
            'status' => $response->status(),
            'body'   => $response->body(),
            'phone'  => $phone,
            'updateData' => $updateData,
        ]);
    }

    return response()->json([
        'message'  => 'Status atualizado com sucesso',
        'supabase' => $response->json(),
    ]);
}


}
