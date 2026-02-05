<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Http\Controllers\RegistrosController;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class CrmController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $url = env('SUPABASE_URL') . '/rest/v1/cliente_dados_posto_das_bebidas';

        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($url, [
            'select' => 'id, nome_cliente, nome_empresa, valor_total, created_at, status, session_id, items, termometro, tags, origem, observacoes, data_follow_up, assunto_follow_up, consultor_id, consultor_nome',
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

        return Inertia::render('CRM', [
            'salesOrders'      => $orders,
            'totalConversions' => 0,
            'products'         => $products,
            'userRole'         => $user->role,
            'consultants'      => $consultants,
        ]);
    }

    public function storeClientManagement(Request $request)
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
            'consultor_id' => $data['consultor_id'] ?? null,
            'consultor_nome' => $data['consultor_nome'] ?? '',
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

 public function updateStatus(Request $request)
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