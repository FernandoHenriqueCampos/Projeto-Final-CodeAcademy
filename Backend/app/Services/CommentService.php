<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommentService
{
    public function create(User $user, Post $post, string $body): Comment
    {
        $comment = $post->comments()->create([
            'user_id' => $user->getKey(),
            'body' => $body,
        ]);

        return $comment->load('user');
    }

    public function update(Comment $comment, array $data): Comment
    {
        $comment->fill($data)->save();

        return $comment->load('user');
    }

    public function delete(Comment $comment): void
    {
        $comment->delete();
    }

    public function listByPost(Post $post, int $perPage = 20): LengthAwarePaginator
    {
        return $post->comments()
            ->with('user')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }
}
