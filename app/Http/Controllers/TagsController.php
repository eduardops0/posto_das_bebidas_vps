<?php

namespace App\Http\Controllers;

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
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class TagsController extends Controller
{

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
}
