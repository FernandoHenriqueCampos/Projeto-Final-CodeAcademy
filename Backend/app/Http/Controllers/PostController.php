<?php

namespace App\Http\Controllers;

use App\Http\Requests\Post\CreatePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PostController extends Controller
{
    public function __construct(private readonly PostService $postService) {}

    public function store(CreatePostRequest $request): JsonResponse
    {
        $post = $this->postService->create(
            $request->user(),
            $request->file('image'),
            $request->validated('caption'),
        );

        return PostResource::make($post)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Request $request, int $post): PostResource
    {
        return PostResource::make($this->postService->find($post, $request->user()));
    }

    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $this->authorize('update', $post);

        return PostResource::make(
            $this->postService->update($post, $request->validated(), $request->user()),
        );
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $this->postService->delete($post);

        return response()->json(['message' => 'Deleted.']);
    }

    public function userPosts(Request $request, User $user): AnonymousResourceCollection
    {
        return PostResource::collection(
            $this->postService->listByUser($user, $request->user(), $this->perPage($request)),
        );
    }
}
