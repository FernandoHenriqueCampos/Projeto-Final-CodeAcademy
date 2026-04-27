<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comment\CreateCommentRequest;
use App\Http\Requests\Comment\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function store(CreateCommentRequest $request, Post $post): JsonResponse
    {
        $comment = $this->commentService->create(
            $request->user(),
            $post,
            $request->validated('body'),
        );

        return CommentResource::make($comment)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function index(Request $request, Post $post): AnonymousResourceCollection
    {
        return CommentResource::collection(
            $this->commentService->listByPost($post, $this->perPage($request, 20)),
        );
    }

    public function update(UpdateCommentRequest $request, Comment $comment): CommentResource
    {
        $this->authorize('update', $comment);

        return CommentResource::make(
            $this->commentService->update($comment, $request->validated()),
        );
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $this->commentService->delete($comment);

        return response()->json(['message' => 'Deleted.']);
    }
}
