<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Accès non autorisé',
                'error' => 'UNAUTHORIZED'
            ], 403);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Permissions insuffisantes',
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'required_roles' => $roles,
                'user_role' => $user->role
            ], 403);
        }

        return $next($request);
    }
}