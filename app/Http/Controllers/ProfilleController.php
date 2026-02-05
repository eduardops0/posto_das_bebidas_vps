<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;


class ProfilleController extends Controller
{
    public function home()
    {   
        $user = Auth::user();

        $tableDetails = null;

        if ($user->role == 'admin' || $user->role == 'equipe_interna') {
            $tableDetails = optional($user->EquipeInternaDetalhes);
        }
        else {
            $tableDetails = optional($user->clientDetail);
        }
        
        return Inertia::render('ProfileSettings', [
            'user' => $user,
            'details' => $tableDetails
        ]);
    }

public function update(Request $request)
{
    $user = Auth::user();

    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'location'     => 'nullable|string|max:255',
        'birthDate'    => 'nullable|date',
        'position'     => 'nullable|string|max:255',
        'website'      => 'nullable|string|max:255',
        'password'     => 'nullable|confirmed|min:8',
        'profileImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $path = null;

    // Define de onde ler/escrever a imagem conforme o papel do usuário
    if ($user->role == 'admin' || $user->role == 'equipe_interna') {
        $path = optional($user->EquipeInternaDetalhes)->profile_image ?? null;
    } else {
        $path = optional($user->clientDetail)->profile_image ?? null;
    }

    if ($request->hasFile('profileImage')) {
        // Deleta imagem antiga se existir
        if ($path && File::exists(public_path($path))) {
            File::delete(public_path($path));
        }

        $image  = $request->file('profileImage');
        $folder = 'uploads/perfis/' . $user->id;

        if (!is_dir(public_path($folder))) {
            mkdir(public_path($folder), 0755, true);
        }

        // Mantém sempre o mesmo nome (ex: profile.jpg) para não gerar lixo
        $filename = 'profile.' . $image->getClientOriginalExtension();
        $image->move(public_path($folder), $filename);
        $path = $folder . '/' . $filename;
    }

    // --- Atualiza senha se enviada ---
    if (!empty($validated['password'])) {
        $user->password = Hash::make($validated['password']);
    }

    // --- Atualiza nome ---
    $user->name = $validated['name'];
    $user->save();

    // Atualiza os detalhes conforme o papel do usuário
    if ($user->role == 'admin' || $user->role == 'equipe_interna') {
            $user->EquipeInternaDetalhes->update([
                'endereco'         => $validated['location']  ?? $user->EquipeInternaDetalhes->endereco,
                'data_aniversario' => $validated['birthDate'] ?? $user->EquipeInternaDetalhes->data_aniversario,
                'profile_image'    => $path,
            ]);

    } else {
        if ($user->clientDetail) {
            // --- Atualiza ClientDetail ---
            $user->clientDetail->update([
                'endereco'         => $validated['location']  ?? $user->clientDetail->endereco,
                'data_aniversario' => $validated['birthDate'] ?? $user->clientDetail->data_aniversario,
                'profile_image'    => $path,
            ]);
        } else {
            // (Opcional) criar o registro, se fizer sentido:
            // $user->clientDetail()->create([
            //     'endereco'         => $validated['location'] ?? null,
            //     'data_aniversario' => $validated['birthDate'] ?? null,
            //     'profile_image'    => $path,
            // ]);
        }
    }

    return response()->json([
        'message'           => 'Perfil atualizado com sucesso',
        'profile_image_url' => $path ? asset($path) : null,
    ]);
}

public function deleteProfileImage(Request $request)
{
    $user = Auth::user();

    $isInternal = ($user->role == 'admin' || $user->role == 'equipe_interna');

    // Identifica de qual relacionamento remover a imagem
    $detail = $isInternal ? optional($user->EquipeInternaDetalhes) : optional($user->clientDetail);

    if (!$detail || !$detail->profile_image) {
        return response()->json(['message' => 'Nenhuma imagem para remover'], 404);
    }

    $storedPath = $detail->profile_image;
    $fullPath   = public_path($storedPath);

    // Apaga o arquivo físico
    if ($storedPath && File::exists($fullPath)) {
        File::delete($fullPath);
    }

    // Remove do banco de dados no relacionamento correto
    if ($isInternal && $user->EquipeInternaDetalhes) {
        $user->EquipeInternaDetalhes->update(['profile_image' => null]);
    } elseif (!$isInternal && $user->clientDetail) {
        $user->clientDetail->update(['profile_image' => null]);
    }

    return response()->json([
        'message' => 'Imagem removida com sucesso',
    ]);
}
}
