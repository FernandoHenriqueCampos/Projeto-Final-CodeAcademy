<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LikeService
{
    public function like(User $user, Post $post): int
    {
        return DB::transaction(function () use ($user, $post): int {
            $user->likedPosts()->syncWithoutDetaching([$post->getKey()]);

            return $post->likes()->count();
        });
    }

    public function unlike(User $user, Post $post): int
    {
        return DB::transaction(function () use ($user, $post): int {
            $user->likedPosts()->detach($post->getKey());

            return $post->likes()->count();
        });
    }

    public function likers(Post $post, int $perPage = 20): LengthAwarePaginator
    {
        return $post->likers()
            ->orderBy('likes.created_at', 'desc')
            ->paginate($perPage);
    }
}
