<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Post;
use App\Services\LikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LikeController extends Controller
{
    public function __construct(private readonly LikeService $likeService) {}

    public function like(Request $request, Post $post): JsonResponse
    {
        $likesCount = $this->likeService->like($request->user(), $post);

        return response()->json([
            'message' => 'Liked.',
            'liked' => true,
            'likes_count' => $likesCount,
        ]);
    }

    public function unlike(Request $request, Post $post): JsonResponse
    {
        $likesCount = $this->likeService->unlike($request->user(), $post);

        return response()->json([
            'message' => 'Unliked.',
            'liked' => false,
            'likes_count' => $likesCount,
        ]);
    }

    public function likers(Request $request, Post $post): AnonymousResourceCollection
    {
        return UserResource::collection(
            $this->likeService->likers($post, $this->perPage($request, 20)),
        );
    }
}
