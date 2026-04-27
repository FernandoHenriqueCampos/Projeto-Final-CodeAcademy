<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\SearchUsersRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UploadAvatarRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function show(string $username): JsonResponse
    {
        return response()->json(
            UserResource::make($this->userService->findByUsername($username))->resolve(),
        );
    }

    public function updateMe(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->userService->updateProfile(
            $request->user(),
            $request->validated(),
        );

        return response()->json(UserResource::make($user)->withEmail()->resolve());
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $this->userService->uploadAvatar(
            $request->user(),
            $request->file('avatar'),
        );

        return response()->json(UserResource::make($user)->withEmail()->resolve());
    }

    public function search(SearchUsersRequest $request): AnonymousResourceCollection
    {
        return UserResource::collection(
            $this->userService->search(
                $request->validated('q'),
                (int) $request->validated('per_page', 15),
            ),
        );
    }

    public function suggestions(Request $request): AnonymousResourceCollection
    {
        return UserResource::collection(
            $this->userService->suggestions($request->user(), $this->perPage($request, 20, 50)),
        );
    }
}
