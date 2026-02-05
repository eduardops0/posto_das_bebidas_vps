<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Tag;
use App\Models\Task;
use App\Models\ClientDetail;
use App\Models\ConsultantDetail;
use App\Models\EquipeInternaDetail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class AdminController extends Controller
{

    public function index()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->route('dashboard');
        }

        return Inertia::render('admin/AdminDashboard');
    }

    public function gerenciador_de_metas()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->route('dashboard');
        }

        // Fetch consultants
        $consultants = User::where('role', 'consultor')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        });

        // Fetch products from Supabase (like in CRM)
        $productsUrl = env('SUPABASE_URL') . '/rest/v1/produtos_posto_das_bebidas';
        $productsResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($productsUrl, [
            'select' => 'id,produto',
        ]);

        $products = collect($productsResponse->json() ?? [])->map(function ($product) {
            return [
                'id' => $product['id'] ?? null,
                'nome' => $product['produto'] ?? '',
                'categoria' => 'Bebidas', // Default category, you can make this dynamic
                'existe_no_banco' => true,
            ];
        });

        // Fetch goals from Supabase
        $goalsUrl = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas';
        $goalsResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($goalsUrl);

        $goalsRaw = $goalsResponse->json() ?? [];

        // Process goals to decode JSON fields and map consultants to full objects
        $consultantsMap = collect($consultants)->keyBy('id');
        $productsMap = collect($products)->keyBy('id');
        $goals = collect($goalsRaw)->map(function ($goal) use ($consultantsMap, $productsMap, $consultants) {
            $consultantIds = json_decode($goal['consultants'] ?? '[]', true) ?? [];
            $mappedConsultants = collect($consultantIds)->map(function ($id) use ($consultantsMap) {
                return $consultantsMap->get($id);
            })->filter()->values()->toArray();

            // For time goals, if no consultants specified, apply to all
            if ($goal['type'] === 'time' && empty($mappedConsultants)) {
                $mappedConsultants = $consultants;
            }

            return [
                'id' => $goal['id'],
                'consultants' => $mappedConsultants,
                'products' => collect(json_decode($goal['products'] ?? '[]', true) ?? [])->map(function ($id) use ($productsMap) {
                    return $productsMap->get($id);
                })->filter()->values()->toArray(),
                'startDate' => $goal['start_date'],
                'endDate' => $goal['end_date'],
                'type' => $goal['type'],
                'target_value' => $goal['target_value'],
                'commission_value' => $goal['commission_value'],
                'status' => $goal['status'],
                'created_at' => $goal['created_at'],
                'updated_at' => $goal['updated_at'],
            ];
        })->toArray();

        return Inertia::render('admin/GerenciarMetas', [
            'consultores' => $consultants,
            'produtos' => $products,
            'goals' => $goals,
        ]);
    }

    public function fornecedores()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->route('dashboard');
        }

        // Fetch fornecedores from Supabase
        $fornecedoresUrl = env('SUPABASE_URL') . '/rest/v1/fornecedores_posto_das_bebidas';
        $fornecedoresResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($fornecedoresUrl);

        $fornecedores = $fornecedoresResponse->json() ?? [];

        // Fetch products from Supabase (like in gerenciador_de_metas)
        $productsUrl = env('SUPABASE_URL') . '/rest/v1/produtos_posto_das_bebidas';
        $productsResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($productsUrl, [
            'select' => 'id,produto',
        ]);

        $products = collect($productsResponse->json() ?? [])->map(function ($product) {
            return [
                'id' => $product['id'] ?? null,
                'nome' => $product['produto'] ?? '',
            ];
        });

        // Fetch cotações from Supabase
        $cotacoesUrl = env('SUPABASE_URL') . '/rest/v1/cotacoes_posto_das_bebidas';
        $cotacoesResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($cotacoesUrl);

        $cotacoesRaw = $cotacoesResponse->json() ?? [];

        // Process cotacoes to decode JSON fields and map fornecedores to full objects
        $fornecedoresMap = collect($fornecedores)->keyBy('id');
        $cotacoes = collect($cotacoesRaw)->map(function ($cotacao) use ($fornecedoresMap) {
            return [
                'id' => $cotacao['id'],
                'fornecedores' => collect(json_decode($cotacao['fornecedores'] ?? '[]', true) ?? [])->map(function ($id) use ($fornecedoresMap) {
                    return $fornecedoresMap->get($id);
                })->filter()->values()->toArray(),
                'arquivo_nome' => $cotacao['arquivo_nome'] ?? '',
                'arquivo_path' => $cotacao['arquivo_path'] ?? '',
                'arquivo_tipo' => $cotacao['arquivo_tipo'] ?? '',
                'prazo_maximo' => $cotacao['prazo_maximo'],
                'status' => $cotacao['status'],
                'data_agendada' => $cotacao['data_agendada'],
                'created_at' => $cotacao['created_at'],
            ];
        })->toArray();

        return Inertia::render('admin/Fornecedores', [
            'fornecedores' => $fornecedores,
            'produtos' => $products,
            'cotacoes' => $cotacoes,
        ]);
    }

    // Store new fornecedor
    public function storeFornecedor(Request $request)
    {
        $validated = $request->validate([
            'nome_empresa' => 'required|string|max:255',
            'nome_responsavel' => 'required|string|max:255',
            'whatsapp' => 'required|string|max:20',
            'status' => 'required|in:active,inactive',
        ]);

        $url = env('SUPABASE_URL') . '/rest/v1/fornecedores_posto_das_bebidas';

        $data = [
            'nome_empresa' => $validated['nome_empresa'],
            'nome_responsavel' => $validated['nome_responsavel'],
            'whatsapp' => $validated['whatsapp'],
            'status' => $validated['status'],
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ];

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->post($url, $data);

        if ($response->successful()) {
            return response()->json($response->json()[0]);
        }

        return response()->json(['error' => 'Failed to create fornecedor'], 500);
    }

    // Update fornecedor
    public function updateFornecedor(Request $request, $id)
    {
        $validated = $request->validate([
            'nome_empresa' => 'required|string|max:255',
            'nome_responsavel' => 'required|string|max:255',
            'whatsapp' => 'required|string|max:20',
            'status' => 'required|in:active,inactive',
        ]);

        $url = env('SUPABASE_URL') . '/rest/v1/fornecedores_posto_das_bebidas?id=eq.' . $id;

        $data = [
            'nome_empresa' => $validated['nome_empresa'],
            'nome_responsavel' => $validated['nome_responsavel'],
            'whatsapp' => $validated['whatsapp'],
            'status' => $validated['status'],
            'updated_at' => now()->toISOString(),
        ];

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->patch($url, $data);

        if ($response->successful()) {
            return response()->json($response->json()[0]);
        }

        return response()->json(['error' => 'Failed to update fornecedor'], 500);
    }

    // Delete fornecedor
    public function destroyFornecedor($id)
    {
        $url = env('SUPABASE_URL') . '/rest/v1/fornecedores_posto_das_bebidas?id=eq.' . $id;

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->delete($url);

        if ($response->successful()) {
            return response()->json(['message' => 'Fornecedor deleted successfully']);
        }

        return response()->json(['error' => 'Failed to delete forneedor'], 500);
    }

    // Store cotacao
    public function storeCotacao(Request $request)
    {
        // Preprocess JSON fields and boolean conversion
        $fornecedoresInput = $request->input('fornecedores');
        $fornecedores = is_string($fornecedoresInput)
            ? json_decode($fornecedoresInput, true)
            : $fornecedoresInput;

        if (!is_array($fornecedores)) {
            $fornecedores = [];
        }

        $request->merge([
            'fornecedores' => $fornecedores,
        ]);

        // Debug: Log all request data to identify validation issues
        \Log::info('Cotacao request data:', [
            'all_data' => $request->all(),
            'files' => $request->file(),
            'fornecedores' => $request->input('fornecedores'),
            'has_file' => $request->hasFile('arquivo'),
            'headers' => $request->headers->all(),
        ]);

        try {
            $validated = $request->validate([
                'fornecedores' => 'required|array',
                'arquivo' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
            ]);

            \Log::info('Validation passed, proceeding with file handling');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', [
                'errors' => $e->errors(),
                'validated_data' => $e->validator->validated(),
            ]);

            // Return validation errors for debugging
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors(),
                'request_data' => [
                    'fornecedores' => $request->input('fornecedores'),
                    'has_file' => $request->hasFile('arquivo'),
                ]
            ], 422);
        }

        $url = env('SUPABASE_URL') . '/rest/v1/cotacoes_posto_das_bebidas';

        // Store the uploaded file locally (metadata is not stored on Supabase)
        $file = $request->file('arquivo');
        \Log::info('File handling:', [
            'file_exists' => !!$file,
            'file_name' => $file ? $file->getClientOriginalName() : 'no file',
            'file_size' => $file ? $file->getSize() : 'no file'
        ]);

        if (!$file) {
            \Log::error('No file received in request');
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('cotacoes', $fileName, 'public');

        // Next Monday at 13:00; if today is Monday before 13:00, use today at 13:00
        $now = Carbon::now();
        $nextMonday = $now->copy()->next(Carbon::MONDAY)->setTime(13, 0);
        if ($now->isMonday() && $now->lessThan($nextMonday)) {
            $nextMonday = $now->copy()->setTime(13, 0);
        }
        $prazoMaximo = $nextMonday->toISOString();
        $dataAgendada = $prazoMaximo;

        $arquivoBase64 = null;
        if ($filePath && Storage::disk('public')->exists($filePath)) {
            $arquivoBase64 = base64_encode(Storage::disk('public')->get($filePath));
        }

        // Payload aligned with Supabase table columns (arquivo fields are not present there)
        $supabaseData = [
            'fornecedores' => json_encode($validated['fornecedores']),
            'prazo_maximo' => $prazoMaximo,
            'status' => 'scheduled',
            'data_agendada' => $dataAgendada,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
            'base64' => $arquivoBase64,
        ];

        $fileMetadata = [
            'arquivo_nome' => $file->getClientOriginalName(),
            'arquivo_path' => $filePath,
            'arquivo_tipo' => $file->getClientMimeType(),
        ];

        $arquivoBase64 = null;
        if ($filePath && Storage::disk('public')->exists($filePath)) {
            $arquivoBase64 = base64_encode(Storage::disk('public')->get($filePath));
        }

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->post($url, $supabaseData);

        if ($response->successful()) {
            $createdCotacao = array_merge($response->json()[0] ?? [], $fileMetadata, [
                'base64' => $arquivoBase64,
            ]);
            return response()->json($createdCotacao);
        }

        \Log::error('Failed to create cotacao via Supabase', [
            'status' => $response->status(),
            'body' => $response->body(),
            'payload' => $supabaseData,
        ]);

        return response()->json([
            'error' => 'Failed to create cotacao',
            'supabase_status' => $response->status(),
            'supabase_body' => $response->json()
        ], 500);
    }

    // Test endpoint to debug quotation creation
    public function testQuotation(Request $request) {
        return response()->json([
            'received_data' => $request->all(),
            'has_file' => $request->hasFile('arquivo'),
            'file_info' => $request->file('arquivo') ? [
                'original_name' => $request->file('arquivo')->getClientOriginalName(),
                'size' => $request->file('arquivo')->getSize(),
                'mime_type' => $request->file('arquivo')->getMimeType(),
            ] : null,
            'headers' => $request->headers->all(),
        ]);
    }

    // Update cotacao
    public function updateCotacao(Request $request, $id)
    {
        // Preprocess JSON fields
        $fornecedoresInput = $request->input('fornecedores');
        $fornecedores = is_string($fornecedoresInput)
            ? json_decode($fornecedoresInput, true)
            : $fornecedoresInput;

        if (!is_array($fornecedores)) {
            $fornecedores = [];
        }

        $request->merge([
            'fornecedores' => $fornecedores,
        ]);

        $validated = $request->validate([
            'fornecedores' => 'required|array',
            'arquivo' => 'nullable|file|mimes:xlsx,xls,csv|max:10240', // 10MB max, nullable for updates
        ]);

        $url = env('SUPABASE_URL') . '/rest/v1/cotacoes_posto_das_bebidas?id=eq.' . $id;

        // Next Monday at 13:00; if today is Monday before 13:00, use today at 13:00
        $now = Carbon::now();
        $nextMonday = $now->copy()->next(Carbon::MONDAY)->setTime(13, 0);
        if ($now->isMonday() && $now->lessThan($nextMonday)) {
            $nextMonday = $now->copy()->setTime(13, 0);
        }
        $prazoMaximo = $nextMonday->toISOString();
        $dataAgendada = $prazoMaximo;

        $data = [
            'fornecedores' => json_encode($validated['fornecedores']),
            'prazo_maximo' => $prazoMaximo,
            'status' => 'scheduled',
            'data_agendada' => $dataAgendada,
            'updated_at' => now()->toISOString(),
        ];

        // Handle file upload for updates (metadata only)
        $filePath = null;
        $fileMetadata = [];
        $arquivoBase64 = null;
        if ($request->hasFile('arquivo')) {
            $file = $request->file('arquivo');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('cotacoes', $fileName, 'public');
            
            $fileMetadata = [
                'arquivo_nome' => $file->getClientOriginalName(),
                'arquivo_path' => $filePath,
                'arquivo_tipo' => $file->getClientMimeType(),
            ];

            if ($filePath && Storage::disk('public')->exists($filePath)) {
                $arquivoBase64 = base64_encode(Storage::disk('public')->get($filePath));
            }

            $data['base64'] = $arquivoBase64;
        }

        $arquivoBase64 = null;
        if ($filePath && Storage::disk('public')->exists($filePath)) {
            $arquivoBase64 = base64_encode(Storage::disk('public')->get($filePath));
        }

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->patch($url, $data);

        if ($response->successful()) {
            $updatedCotacao = $response->json()[0] ?? [];

            if ($arquivoBase64 !== null) {
                $updatedCotacao['base64'] = $arquivoBase64;
            }

            $updatedCotacao = array_merge($updatedCotacao, $fileMetadata);
            return response()->json($updatedCotacao);
        }

        \Log::error('Failed to update cotacao via Supabase', [
            'status' => $response->status(),
            'body' => $response->body(),
            'payload' => $data,
        ]);

        return response()->json([
            'error' => 'Failed to update cotacao',
            'supabase_status' => $response->status(),
            'supabase_body' => $response->json()
        ], 500);
    }

    // Delete cotacao
    public function destroyCotacao($id)
    {
        $url = env('SUPABASE_URL') . '/rest/v1/cotacoes_posto_das_bebidas?id=eq.' . $id;

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->delete($url);

        if ($response->successful()) {
            return response()->json(['message' => 'Cotacao deleted successfully']);
        }

        return response()->json(['error' => 'Failed to delete cotacao'], 500);
    }


    public function gerenciarConsultores()
    {
        $consultants = User::where('role', 'consultor')->get();

        $formattedConsultants = $consultants->map(function ($user) {
            return [
                'id' => $user->id,
                'nome' => $user->name,
                'email' => $user->email,
                'telefone' => $user->telefone
            ];
        });

        return Inertia::render('admin/GerenciarConsultores', [
            'consultores' => $formattedConsultants,
        ]);
    }

    public function GerenciarEquipeInterna()
    {
        $UsuariosInternos = User::where('role', 'equipe_interna')
            ->with('EquipeInternaDetalhes')
            ->get();

        $formattedUsuariosInternos = $UsuariosInternos->map(function ($user) {
            return [
                'id' => $user->id,
                'nome' => $user->name,
                'email' => $user->email,
                'cpf' => optional($user->EquipeInternaDetalhes)->cpf,
                'telefone' => optional($user->EquipeInternaDetalhes)->telefone,
                'endereco' => optional($user->EquipeInternaDetalhes)->endereco,
                'data_aniversario' => optional($user->EquipeInternaDetalhes)->data_nascimento,
        
            ];
        });

        return Inertia::render('admin/GerenciarEquipeInterna', [
            'UsuariosInternos' => $formattedUsuariosInternos,
        ]);
    }


    public function createNewClient(Request $request)
    {
        
        // Validação dos dados
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'senha' => 'required|string|min:6',
            'telefone' => 'nullable|string|max:255',
            'endereco' => 'nullable|string|max:255',
            'data_aniversario' => 'nullable|date',
            'canal_de_aquisicao' => 'nullable|string|max:255',

            'razao_social' => 'nullable|string|max:255',
            'cnpj' => 'nullable|string|max:255',
            'nome_completo_socio' => 'nullable|string|max:255',
            'cpf_socio' => 'nullable|string|max:255',
            'responsavel' => 'nullable|string|max:255',
            'instancia' => 'nullable|string|max:255',
            'data_inicio' => 'nullable|date',
            'vencimento_do_contrato' => 'nullable|date',
            'descricao_do_servico' => 'nullable|string',
            'workflow_link' => 'nullable|string|max:255',
            'valor_setup' => 'nullable|numeric',
            'setup_pago' => 'boolean',
            'setup_status' => ['required', Rule::in(['Pendente', 'Pago', 'Cancelado'])],
            'valor_mensalidade' => 'nullable|numeric',
            'data_mensalidade' => 'nullable|date',
            'mensalidade_status' => ['required', Rule::in(['Em dia', 'Atrasado', 'Cancelado'])],
        ]);

        // Criar o usuário
        $user = User::create([
            'name' => $validated['nome'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['senha']),
            'role' => 'cliente', // ou outro valor conforme seu sistema
        ]);

        // Criar detalhes do cliente
        ClientDetail::create([
            'user_id' => $user->id,
            'razao_social' => $validated['razao_social'] ?? null,
            'cnpj' => $validated['cnpj'] ?? null,
            'nome_completo_socio' => $validated['nome_completo_socio'] ?? null,
            'cpf_socio' => $validated['cpf_socio'] ?? null,
            'instancia' => $validated['instancia'] ?? null,
            'telefone' => $validated['telefone'] ?? null,
            'endereco' => $validated['endereco'] ?? null,
            'responsavel' => $validated['responsavel'] ?? null,
            'data_inicio' => $validated['data_inicio'] ?? null,
            'vencimento_do_contrato' => $validated['vencimento_do_contrato'] ?? null,
            'valor_setup' => $validated['valor_setup'] ?? 0,
            'setup_pago' => $validated['setup_pago'] ?? false,
            'setup_status' => $validated['setup_status'],
            'valor_mensalidade' => $validated['valor_mensalidade'] ?? 0,
            'data_mensalidade' => $validated['data_mensalidade'] ?? null,
            'mensalidade_status' => $validated['mensalidade_status'],
            'workflow_link' => $validated['workflow_link'] ?? null,
            'descricao_do_servico' => $validated['descricao_do_servico'] ?? null,
            'data_aniversario' => $validated['data_aniversario'] ?? null,
            'canal_de_aquisicao' => $validated['canal_de_aquisicao'] ?? null,
        ]);

        return response()->json([
            'message' => 'Cliente criado com sucesso!',
            'user_id' => $user->id
        ]);
    }

    public function createNewConsultant(Request $request)
    {

        // Validação dos dados
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'senha' => 'required|string|min:6',
            'telefone' => 'nullable|string|max:255',
        ]);

        // Criar o usuário
        $user = User::create([
            'name' => $validated['nome'],
            'email' => $validated['email'],
            'telefone' => $validated['telefone'] ?? null,
            'password' => Hash::make($validated['senha']),
            'role' => 'consultor',
        ]);

        return response()->json([
            'message' => 'Consultor criado com sucesso!',
            'user_id' => $user->id
        ]);
    }

    public function updateConsultant(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Validação dos dados
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'telefone' => 'nullable|string|max:255',
            'senha' => 'nullable|string|min:6',
        ]);

        // Atualizar o usuário
        $user->name = $validated['nome'];
        $user->email = $validated['email'];
        $user->telefone = $validated['telefone'] ?? null;
        if (!empty($validated['senha'])) {
            $user->password = Hash::make($validated['senha']);
        }
        $user->save();

        return response()->json([
            'message' => 'Consultor atualizado com sucesso!',
            'user_id' => $user->id
        ]);
    }

    public function destroyConsultant($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Consultor deletado com sucesso!'
        ]);
    }

    public function CriarNovoUsuarioInterno(Request $request)
    {
        
        // Validação dos dados
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'senha' => 'required|string|min:6',
            'telefone' => 'nullable|string|max:255',
            'endereco' => 'nullable|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'data_aniversario' => 'nullable|date',
            'cpf' => 'nullable|string|max:255',        ]);

        // Criar o usuário
        $user = User::create([
            'name' => $validated['nome'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['senha']),
            'role' => 'equipe_interna',
        ]);

        // Criar detalhes do cliente
        EquipeInternaDetail::create([
            'user_id' => $user->id,
            'nome_completo' => $validated['nome'] ?? null,
            'cpf' => $validated['cpf'] ?? null,
            'categoria' => $validated['categoria'] ?? null,
            'telefone' => $validated['telefone'] ?? null,
            'endereco' => $validated['endereco'] ?? null,
            'data_nascimento' => $validated['data_aniversario'] ?? null,
        ]);

        return response()->json([
            'message' => 'Usuario criado com sucesso!',
            'user_id' => $user->id
        ]);
    }




    public function tagManagement() {
        $user = Auth::user();
        $tags = Tag::orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/GerenciarTags',[
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

    public function storeClientManagement(Request $request)
    {
        $data = $request->all();

        $user = auth()->user();
        $url = env('SUPABASE_URL') . '/rest/v1/cliente_dados_consultor_apresentacao';

        // Campos para atualizar no Supabase baseados nos dados do modal
        $updateData = [
            'nome_cliente' => $data['clientName'],
            'nome_empresa' => $data['nome_empresa'] ?? '',
            'valor_total'  => $data['totalValue'] ?? 0,
            'status'       => $data['status'],
            'termometro'   => $data['termometro'],
            'origem'       => $data['origem'],
            'tags'         => json_encode($data['tags'] ?? []),
            'items'        => json_encode($data['items'] ?? []),
            'observacoes'  => $data['observacoes'] ?? '',
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

    /**
     * Goals CRUD
     */
    public function storeGoal(Request $request)
    {
        $validated = $request->validate([
            'consultants' => 'sometimes|array',
            'consultants.*' => 'integer|exists:users,id',
            'products' => 'sometimes|array',
            'products.*' => 'integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'type' => 'required|in:percentage,bonus,time',
            'target_value' => 'required|numeric|min:0',
            'commission_value' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        // For time goals, apply to all consultants and no products
        if ($validated['type'] === 'time') {
            $allConsultants = User::where('role', 'consultor')->pluck('id')->toArray();
            $validated['consultants'] = $allConsultants;
            $validated['products'] = [];
        }

        $url = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas';

        $data = [
            'consultants' => json_encode($validated['consultants'] ?? []),
            'products' => json_encode($validated['products'] ?? []),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'type' => $validated['type'],
            'target_value' => $validated['target_value'],
            'commission_value' => $validated['commission_value'],
            'status' => $validated['status'],
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ];

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->post($url, $data);

        if ($response->successful()) {
            return response()->json($response->json()[0]);
        }

        return response()->json(['error' => 'Failed to create goal'], 500);
    }

    public function updateGoal(Request $request, $id)
    {
        $validated = $request->validate([
            'consultants' => 'sometimes|array',
            'consultants.*' => 'integer|exists:users,id',
            'products' => 'sometimes|array',
            'products.*' => 'integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'type' => 'required|in:percentage,bonus,time',
            'target_value' => 'required|numeric|min:0',
            'commission_value' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        // For time goals, apply to all consultants and no products
        if ($validated['type'] === 'time') {
            $allConsultants = User::where('role', 'consultor')->pluck('id')->toArray();
            $validated['consultants'] = $allConsultants;
            $validated['products'] = [];
        }

        $url = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas?id=eq.' . $id;

        $data = [
            'consultants' => json_encode($validated['consultants'] ?? []),
            'products' => json_encode($validated['products'] ?? []),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'type' => $validated['type'],
            'target_value' => $validated['target_value'],
            'commission_value' => $validated['commission_value'],
            'status' => $validated['status'],
            'updated_at' => now()->toISOString(),
        ];

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->patch($url, $data);

        if ($response->successful()) {
            return response()->json($response->json()[0]);
        }

        return response()->json(['error' => 'Failed to update goal'], 500);
    }

    public function destroyGoal($id)
    {
        $url = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas?id=eq.' . $id;

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->delete($url);

        if ($response->successful()) {
            return response()->json(['message' => 'Goal deleted successfully']);
        }

        return response()->json(['error' => 'Failed to delete goal'], 500);
    }

    public function toggleGoalStatus($id)
    {
        // First get current status
        $url = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas?id=eq.' . $id;
        $getResponse = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
        ])->get($url);

        if (!$getResponse->successful() || empty($getResponse->json())) {
            return response()->json(['error' => 'Goal not found'], 404);
        }

        $goal = $getResponse->json()[0];
        $newStatus = $goal['status'] === 'active' ? 'inactive' : 'active';

        $updateUrl = env('SUPABASE_URL') . '/rest/v1/metas_posto_das_bebidas?id=eq.' . $id;
        $data = [
            'status' => $newStatus,
            'updated_at' => now()->toISOString(),
        ];

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_SERVICE_ROLE'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ])->patch($updateUrl, $data);

        if ($response->successful()) {
            return response()->json($response->json()[0]);
        }

        return response()->json(['error' => 'Failed to update goal status'], 500);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
