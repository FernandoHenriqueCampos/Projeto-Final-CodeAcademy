<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        return $this->tokenResponse(
            $this->authService->register($request->validated()),
            Response::HTTP_CREATED,
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->tokenResponse($this->authService->login($request->validated()));
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json(['message' => 'Successfully logged out.']);
    }

    public function refresh(): JsonResponse
    {
        return $this->tokenResponse($this->authService->refresh());
    }

    public function me(): JsonResponse
    {
        return response()->json(
            UserResource::make($this->authService->me())->withEmail()->resolve(),
        );
    }

    private function tokenResponse(array $payload, int $status = Response::HTTP_OK): JsonResponse
    {
        $payload['user'] = UserResource::make($payload['user'])->withEmail()->resolve();

        return response()->json($payload, $status);
    }
}
