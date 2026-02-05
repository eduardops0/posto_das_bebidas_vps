<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class RegistrosController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $url = env('SUPABASE_URL') . '/rest/v1/registros_posto_das_bebidas';

        $query = http_build_query([
            'select' => 'id, data, nome_cliente, nome_empresa, valor_total, origem, consultor_id, consultor_nome, created_at',
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

        return Inertia::render('Registros', [
            'user'        => $user,
            'conversions' => $conversions,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $url = env('SUPABASE_URL') . '/rest/v1/registros_posto_das_bebidas';

        $payload = [
            'data'         => now()->toISOString(),
            'nome_cliente' => $data['nome_cliente'] ?? '',
            'nome_empresa' => $data['nome_empresa'] ?? '',
            'valor_total'  => $data['valor_total'] ?? 0,
            'origem'       => $data['origem'] ?: 'Indefinido',
            'consultor_id' => $data['consultor_id'] ?? null,
            'consultor_nome' => $data['consultor_nome'] ?? '',
        ];

        \Log::info('Tentando inserir registro', ['payload' => $payload]);

        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type'  => 'application/json',
            'Prefer'        => 'return=representation'
        ])->post($url, $payload);

        if ($response->successful()) {
            \Log::info('Registro inserido com sucesso', ['response' => $response->json()]);
            return response()->json([
                'message' => 'Registro criado com sucesso',
                'data'    => $response->json()
            ]);
        } else {
            \Log::error('Erro ao inserir registro', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \Exception('Erro ao criar registro: ' . $response->body());
        }
    }
}
